import 'server-only';
import sharp from 'sharp';
import { storage } from './storage';

/**
 * iPhone photos arrive as HEIC, untouched, so phones never spend time or
 * battery converting them. The JPEG the PDF needs is made here — right after
 * upload, in the background — and kept next to the original.
 */

const MASTER_EDGE = 4096;

export const isHeicExt = (ext: string) => ext === 'heic' || ext === 'heif';
const convertedKey = (prefix: string) => `${prefix}/original.converted.jpg`;

async function heicToJpeg(data: Buffer): Promise<Buffer> {
  const { default: decode } = await import('heic-decode');
  const img = await decode({ buffer: data });
  return sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength), { raw: { width: img.width, height: img.height, channels: 4 } })
    .flatten({ background: '#ffffff' })
    .resize({ width: MASTER_EDGE, height: MASTER_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/** The full-size photo as JPEG/PNG/WebP bytes (HEIC originals are converted once and cached). */
export async function printableOriginal(prefix: string, ext: string): Promise<Buffer | null> {
  const store = storage();
  if (!isHeicExt(ext)) return store.get(`${prefix}/original.${ext}`);
  const cached = await store.get(convertedKey(prefix));
  if (cached) return cached;
  const heic = await store.get(`${prefix}/original.${ext}`);
  if (!heic) return null;
  const jpg = await heicToJpeg(heic);
  await store.put(convertedKey(prefix), jpg, 'image/jpeg');
  return jpg;
}

export const heicExtraKeys = (prefix: string, ext: string) => (isHeicExt(ext) ? [convertedKey(prefix)] : []);
