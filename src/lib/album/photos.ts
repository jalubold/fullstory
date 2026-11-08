import type { PhotoAsset } from './types';

const WIDTH_BUCKETS = [320, 480, 640, 960, 1280, 1600, 2048, 2560];

/** Picks a URL for a photo given the pixel width it will occupy on screen. */
export function photoUrl(asset: PhotoAsset, neededPx: number): string {
  if (asset.urlTemplate) {
    const w = WIDTH_BUCKETS.find((b) => b >= neededPx) ?? WIDTH_BUCKETS[WIDTH_BUCKETS.length - 1];
    return asset.urlTemplate.replace('{w}', String(Math.min(w, asset.width)));
  }
  return neededPx <= 480 ? asset.thumbUrl : asset.displayUrl;
}
