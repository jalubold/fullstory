import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { blobToken, dataDir, storageBucket, storageMode } from '../env';
import { SetupError } from '../db';
import { supabaseAdmin } from '../supabase';

export interface UploadTarget {
  /**
   * 'supabase': PUT form data to the signed url; 'blob': upload with the Vercel
   * Blob client using the scoped client token; 'local': PUT the bytes to url.
   */
  mode: 'supabase' | 'blob' | 'local';
  key: string;
  url: string;
  token?: string;
}

export interface BlobStore {
  put(key: string, data: Buffer | Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  exists(key: string): Promise<boolean>;
  remove(keys: string[]): Promise<void>;
  /** A short-lived URL the browser can fetch directly, or null if it must be streamed. */
  signedUrl(key: string, expiresInSeconds: number, downloadName?: string): Promise<string | null>;
  /** Where the browser should upload a file to. */
  uploadTarget(key: string, localUrl: string): Promise<UploadTarget>;
}

const safeKey = (key: string) => {
  if (key.includes('..') || key.startsWith('/')) throw new Error('Invalid storage key');
  return key;
};

class LocalStore implements BlobStore {
  private root = path.join(dataDir, 'storage');
  private file(key: string) {
    return path.join(this.root, safeKey(key));
  }
  async put(key: string, data: Buffer | Uint8Array) {
    const f = this.file(key);
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, data);
  }
  async get(key: string) {
    try {
      return await fs.readFile(this.file(key));
    } catch {
      return null;
    }
  }
  async exists(key: string) {
    try {
      await fs.access(this.file(key));
      return true;
    } catch {
      return false;
    }
  }
  async remove(keys: string[]) {
    await Promise.all(keys.map((k) => fs.rm(this.file(k), { force: true })));
  }
  async signedUrl() {
    return null;
  }
  async uploadTarget(key: string, localUrl: string): Promise<UploadTarget> {
    return { mode: 'local', key, url: localUrl };
  }
}

class SupabaseStore implements BlobStore {
  private ensured: Promise<void> | null = null;
  private bucket() {
    if (!this.ensured) {
      this.ensured = (async () => {
        const sb = supabaseAdmin();
        const { data } = await sb.storage.getBucket(storageBucket);
        if (!data) {
          const { error } = await sb.storage.createBucket(storageBucket, { public: false });
          if (error && !/already exists/i.test(error.message)) throw error;
        }
      })().catch((e) => {
        this.ensured = null;
        throw e;
      });
    }
    return this.ensured.then(() => supabaseAdmin().storage.from(storageBucket));
  }
  async put(key: string, data: Buffer | Uint8Array, contentType: string) {
    const { error } = await (await this.bucket()).upload(safeKey(key), data, { contentType, upsert: true });
    if (error) throw error;
  }
  async get(key: string) {
    const { data, error } = await (await this.bucket()).download(safeKey(key));
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  async exists(key: string) {
    const dir = path.posix.dirname(key);
    const name = path.posix.basename(key);
    const { data } = await (await this.bucket()).list(dir, { search: name, limit: 10 });
    return !!data?.some((o) => o.name === name);
  }
  async remove(keys: string[]) {
    if (keys.length) await (await this.bucket()).remove(keys.map(safeKey));
  }
  async signedUrl(key: string, expiresIn: number, downloadName?: string) {
    const { data, error } = await (await this.bucket()).createSignedUrl(safeKey(key), expiresIn, downloadName ? { download: downloadName } : undefined);
    if (error) throw error;
    return data.signedUrl;
  }
  async uploadTarget(key: string): Promise<UploadTarget> {
    const { data, error } = await (await this.bucket()).createSignedUploadUrl(safeKey(key), { upsert: true });
    if (error) throw error;
    return { mode: 'supabase', key, url: data.signedUrl, token: data.token };
  }
}

/**
 * Vercel Blob, private store. Browsers upload directly with a client token
 * scoped to one pathname; reads go through short-lived presigned URLs, so large
 * originals and PDFs never pass through a function response.
 */
class VercelBlobStore implements BlobStore {
  private signer: { token: { delegationToken: string; clientSigningToken: string }; until: number } | null = null;
  private sdk() {
    return import('@vercel/blob');
  }
  async put(key: string, data: Buffer | Uint8Array, contentType: string) {
    const { put } = await this.sdk();
    await put(safeKey(key), Buffer.from(data), { access: 'private', contentType, allowOverwrite: true, addRandomSuffix: false, token: blobToken });
  }
  async get(key: string) {
    const { get } = await this.sdk();
    const res = await get(safeKey(key), { access: 'private', useCache: false, token: blobToken });
    if (!res || res.statusCode !== 200) return null;
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  }
  async exists(key: string) {
    const { head, BlobNotFoundError } = await this.sdk();
    try {
      await head(safeKey(key), { token: blobToken });
      return true;
    } catch (e) {
      if (e instanceof BlobNotFoundError) return false;
      throw e;
    }
  }
  async remove(keys: string[]) {
    if (!keys.length) return;
    const { del } = await this.sdk();
    await del(keys.map(safeKey), { token: blobToken });
  }
  async signedUrl(key: string, expiresIn: number) {
    const { issueSignedToken, presignUrl } = await this.sdk();
    const now = Date.now();
    // One read-only delegation for the whole store, refreshed before it expires;
    // each URL is then signed locally for a single pathname.
    if (!this.signer || this.signer.until - now < (expiresIn + 300) * 1000) {
      const issued = await issueSignedToken({ pathname: '*', operations: ['get'], validUntil: now + Math.max(3 * 3600, expiresIn + 900) * 1000, token: blobToken });
      this.signer = { token: issued, until: issued.validUntil };
    }
    const { presignedUrl } = await presignUrl(this.signer.token, { operation: 'get', pathname: safeKey(key), access: 'private', validUntil: now + expiresIn * 1000 });
    return presignedUrl;
  }
  async uploadTarget(key: string): Promise<UploadTarget> {
    const { generateClientTokenFromReadWriteToken } = await import('@vercel/blob/client');
    const token = await generateClientTokenFromReadWriteToken({
      token: blobToken,
      pathname: safeKey(key),
      allowOverwrite: true,
      maximumSizeInBytes: 45 * 1024 * 1024,
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
      validUntil: Date.now() + 3600_000,
    });
    return { mode: 'blob', key, url: '', token };
  }
}

const g = globalThis as unknown as { __fsStore?: BlobStore };

export function storage(): BlobStore {
  if (storageMode === 'none') throw new SetupError('File storage is not configured.');
  if (!g.__fsStore) g.__fsStore = storageMode === 'supabase' ? new SupabaseStore() : storageMode === 'blob' ? new VercelBlobStore() : new LocalStore();
  return g.__fsStore;
}
