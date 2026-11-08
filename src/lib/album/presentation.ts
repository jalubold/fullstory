import type { AlbumDocument, PageAnimation, Presentation } from './types';

export const ANIMATIONS: Array<{ id: PageAnimation; label: string; hint: string }> = [
  { id: 'flip', label: 'Page turn', hint: 'A real 3D page turning over' },
  { id: 'fade', label: 'Dissolve', hint: 'Soft, dreamy cross-fade' },
  { id: 'slide', label: 'Glide', hint: 'Pages glide in from the side' },
  { id: 'zoom', label: 'Cinematic', hint: 'Pulls into focus, like a film' },
  { id: 'reveal', label: 'Unveil', hint: 'A clean wipe reveals each page' },
];

export const DEFAULT_PRESENTATION: Presentation = { animation: 'flip', livingPhotos: false, musicUrl: null };

export function presentationOf(doc: Pick<AlbumDocument, 'presentation'> | null | undefined): Presentation {
  return { ...DEFAULT_PRESENTATION, ...(doc?.presentation ?? {}) };
}

/**
 * Turns common share links into direct audio links:
 * - Google Drive "file/d/ID/view" or "open?id=ID" → direct download
 * - Dropbox "?dl=0" → "?raw=1"
 * Returns null for anything that isn't an http(s) URL.
 */
export function normaliseMusicUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.hostname === 'drive.google.com') {
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get('id');
    if (id) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
  }
  if (url.hostname.endsWith('dropbox.com')) {
    url.searchParams.delete('dl');
    url.searchParams.set('raw', '1');
    return url.toString();
  }
  return url.toString();
}
