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
