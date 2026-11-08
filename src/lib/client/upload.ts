import type { PhotoAsset } from '@/lib/album/types';
import type { PreparedImage } from './image-worker';

export { prepareImage } from './image-worker';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_BYTES = 40 * 1024 * 1024;

export interface Target {
  mode: 'supabase' | 'blob' | 'local';
  key: string;
  url: string;
  token?: string;
}

export class UploadError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable = true) {
    super(message);
    this.retryable = retryable;
  }
}

const retryableStatus = (status: number) => status === 0 || status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;

async function put(target: Target, body: Blob, contentType: string, onProgress?: (loaded: number) => void): Promise<void> {
  if (target.mode === 'blob') {
    // Vercel Blob: direct browser upload with a token scoped to this one file.
    const { put: blobPut } = await import('@vercel/blob/client');
    try {
      await blobPut(target.key, body, {
        access: 'private',
        token: target.token!,
        contentType,
        multipart: body.size > 8 * 1024 * 1024,
        onUploadProgress: (e) => onProgress?.(e.loaded),
      });
    } catch (e) {
      throw new UploadError(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed');
    }
    return;
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', target.url);
    let payload: Blob | FormData = body;
    if (target.mode === 'supabase') {
      const fd = new FormData();
      fd.append('cacheControl', '31536000');
      fd.append('', body);
      payload = fd;
      xhr.setRequestHeader('x-upsert', 'true');
    } else {
      xhr.setRequestHeader('Content-Type', contentType);
    }
    xhr.upload.onprogress = (e) => onProgress?.(e.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError(`Upload failed (${xhr.status})`, retryableStatus(xhr.status))));
    xhr.onerror = () => reject(new UploadError('Network error while uploading'));
    xhr.send(payload);
  });
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new UploadError(data.error ?? `Request failed (${res.status})`, retryableStatus(res.status));
  return data as T;
}

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    if (/heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) return `“${file.name}” is a HEIC photo. Please export it as JPEG first.`;
    return `“${file.name}” isn’t a supported image. Use JPEG, PNG or WebP.`;
  }
  if (file.size > MAX_BYTES) return `“${file.name}” is larger than 40 MB.`;
  return null;
}

export interface Registered {
  photoId: string;
  targets: Record<'original' | 'display' | 'thumb', Target>;
}

/** Reserves a photo record and returns where to send its three files. Fast: no image bytes involved. */
export function registerPhoto(projectId: string, file: File, img: PreparedImage): Promise<Registered> {
  const master = img.master;
  return api<Registered>(`/api/projects/${projectId}/photos`, {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      contentType: master ? 'image/jpeg' : file.type,
      size: master ? master.size : file.size,
      width: img.width,
      height: img.height,
    }),
  });
}

/** Sends the small screen copies first (so the photo is safe to view sooner), then the master. */
export async function sendPhoto(file: File, img: PreparedImage, reg: Registered, onProgress?: (fraction: number) => void): Promise<void> {
  const original = img.master ?? file;
  const originalType = img.master ? 'image/jpeg' : file.type;
  const total = original.size + img.display.size + img.thumb.size;
  const loaded = { original: 0, display: 0, thumb: 0 };
  const report = () => onProgress?.((loaded.original + loaded.display + loaded.thumb) / total);
  await Promise.all([
    put(reg.targets.thumb, img.thumb, 'image/jpeg', (n) => ((loaded.thumb = n), report())),
    put(reg.targets.display, img.display, 'image/jpeg', (n) => ((loaded.display = n), report())),
  ]);
  await put(reg.targets.original, original, originalType, (n) => ((loaded.original = n), report()));
}

export async function completePhoto(photoId: string): Promise<PhotoAsset> {
  const { photo } = await api<{ photo: PhotoAsset }>(`/api/photos/${photoId}/complete`, { method: 'POST' });
  return photo;
}

/** Retries a network step a couple of times — phone connections drop for a moment all the time. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (e instanceof UploadError && !e.retryable) break;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 600 * 2 ** i));
    }
  }
  throw last;
}

/** Runs async tasks with limited concurrency. */
export async function pool<T>(items: T[], limit: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}
