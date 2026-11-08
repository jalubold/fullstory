import raw from './sample-photos.json';
import type { PhotoAsset, PhotoMap } from '@/lib/album/types';

export interface SamplePhoto {
  key: string;
  category: string;
  set: string;
  unsplashId: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  subject: string;
  location: string | null;
  photographer: { username: string; name: string };
  blurHash: string;
}

export const SAMPLE_PHOTOS = raw as SamplePhoto[];

const B83 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';

/** Average colour of a BlurHash (its DC component) — used as a loading placeholder. */
export function blurHashColor(hash: string): string {
  if (!hash || hash.length < 6) return '#E8E2D8';
  let v = 0;
  for (const ch of hash.slice(2, 6)) v = v * 83 + B83.indexOf(ch);
  return `#${v.toString(16).padStart(6, '0')}`;
}

export const sampleId = (key: string) => `s:${key}`;

export function sampleAsset(p: SamplePhoto): PhotoAsset {
  const base = `${p.url}?auto=format&fit=max&q=72`;
  return {
    id: sampleId(p.key),
    width: p.width,
    height: p.height,
    thumbUrl: `${base}&w=480`,
    displayUrl: `${base}&w=1600`,
    urlTemplate: `${base}&w={w}`,
    placeholder: blurHashColor(p.blurHash),
    alt: p.alt,
  };
}

export const SAMPLE_PHOTO_MAP: PhotoMap = Object.fromEntries(SAMPLE_PHOTOS.map((p) => [sampleId(p.key), sampleAsset(p)]));

export function samplePhotosFor(ids: Iterable<string>): PhotoMap {
  const out: PhotoMap = {};
  for (const id of ids) if (SAMPLE_PHOTO_MAP[id]) out[id] = SAMPLE_PHOTO_MAP[id];
  return out;
}
