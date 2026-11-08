import type { PhotoAsset } from '@/lib/album/types';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_BYTES = 40 * 1024 * 1024;

interface Target {
  mode: 'supabase' | 'local';
  url: string;
  token?: string;
}

export class UploadError extends Error {}

async function toJpeg(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  if (typeof OffscreenCanvas !== 'undefined') {
    const c = new OffscreenCanvas(w, h);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, w, h);
    return c.convertToBlob({ type: 'image/jpeg', quality });
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new UploadError('Could not process image'))), 'image/jpeg', quality));
}

/** Decodes an image (respecting EXIF orientation) and makes screen-size derivatives. */
export async function processImage(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new UploadError(`“${file.name}” couldn’t be read. Is it a valid image?`);
  }
  try {
    const [display, thumb] = await Promise.all([toJpeg(bitmap, 1600, 0.86), toJpeg(bitmap, 480, 0.8)]);
    return { width: bitmap.width, height: bitmap.height, display, thumb };
  } finally {
    bitmap.close();
  }
}

function put(target: Target, body: Blob, contentType: string, onProgress?: (loaded: number) => void): Promise<void> {
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
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new UploadError('Network error while uploading'));
    xhr.send(payload);
  });
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new UploadError(data.error ?? `Request failed (${res.status})`);
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

/** Full upload pipeline for one photo: process → register → upload 3 variants → complete. */
export async function uploadPhoto(projectId: string, file: File, onProgress?: (fraction: number) => void): Promise<PhotoAsset> {
  const invalid = validateFile(file);
  if (invalid) throw new UploadError(invalid);
  onProgress?.(0.02);
  const { width, height, display, thumb } = await processImage(file);
  onProgress?.(0.1);
  const { photoId, targets } = await api<{ photoId: string; targets: Record<'original' | 'display' | 'thumb', Target> }>(`/api/projects/${projectId}/photos`, {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, width, height }),
  });
  const total = file.size + display.size + thumb.size;
  const loaded = { original: 0, display: 0, thumb: 0 };
  const report = () => onProgress?.(0.1 + 0.85 * ((loaded.original + loaded.display + loaded.thumb) / total));
  await Promise.all([
    put(targets.thumb, thumb, 'image/jpeg', (n) => ((loaded.thumb = n), report())),
    put(targets.display, display, 'image/jpeg', (n) => ((loaded.display = n), report())),
    put(targets.original, file, file.type, (n) => ((loaded.original = n), report())),
  ]);
  const { photo } = await api<{ photo: PhotoAsset }>(`/api/photos/${photoId}/complete`, { method: 'POST' });
  onProgress?.(1);
  return photo;
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
