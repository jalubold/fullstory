import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { dataDir, storageBucket, storageMode } from '../env';
import { SetupError } from '../db';
import { supabaseAdmin } from '../supabase';

export interface UploadTarget {
  /** 'supabase': upload with supabase-js uploadToSignedUrl; 'local': PUT the bytes to url. */
  mode: 'supabase' | 'local';
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

const g = globalThis as unknown as { __fsStore?: BlobStore };

export function storage(): BlobStore {
  if (storageMode === 'none') throw new SetupError('File storage is not configured.');
  if (!g.__fsStore) g.__fsStore = storageMode === 'supabase' ? new SupabaseStore() : new LocalStore();
  return g.__fsStore;
}
