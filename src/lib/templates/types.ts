import type { Tone } from '@/lib/album/layouts';
import type { OrnamentId } from '@/lib/album/ornaments';
import type { Background, Orientation, PhotoFilter, Theme } from '@/lib/album/types';
import type { CategoryId, StyleId } from './taxonomy';

export interface TemplateOrnament {
  ornament: OrnamentId;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  tone?: Tone | string;
  opacity?: number;
}

export interface TemplatePage {
  layout: string;
  /** Text for the layout's text slots, in slot order. */
  texts?: string[];
  /** Explicit sample photo keys, in slot order. Otherwise photos are auto-assigned. */
  photos?: string[];
  bg?: Partial<Background>;
  extras?: TemplateOrnament[];
  filter?: PhotoFilter;
  /** Light text on a dark page background. */
  invert?: boolean;
}

export interface TemplateDef {
  id: string;
  name: string;
  category: CategoryId;
  style: StyleId;
  orientation: Orientation;
  tier: 'free' | 'premium';
  featured?: boolean;
  /** One-line summary for cards. */
  summary: string;
  /** Longer description for the detail page. */
  description: string;
  highlights: string[];
  theme: Theme;
  /** Sample-photo pool used for the demo album. Sets are used first, in order. */
  pool: { sets?: string[]; categories?: string[] };
  cover: TemplatePage;
  back: TemplatePage;
  pages: TemplatePage[];
  spineText: string;
}
