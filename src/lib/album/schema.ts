import { z } from 'zod';
import { FONTS, type FontId } from './fonts';
import { ORNAMENTS, type OrnamentId } from './ornaments';

/** Runtime validation for documents received from clients. */

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const num = z.number().finite();
const frac = num.min(-2).max(3);
const fontId = z.string().refine((v): v is FontId => v in FONTS, 'Unknown font');
const ornamentId = z.string().refine((v): v is OrnamentId => v in ORNAMENTS, 'Unknown ornament');

const base = {
  id: z.string().min(1).max(64),
  x: frac,
  y: frac,
  w: num.min(0.001).max(3),
  h: num.min(0.001).max(3),
  rotation: num.min(-360).max(360),
  locked: z.boolean().optional(),
  fromLayout: z.boolean().optional(),
};

const textStyle = {
  font: fontId,
  weight: num.min(100).max(900),
  italic: z.boolean(),
  size: num.min(2).max(400),
  color,
  lineHeight: num.min(0.6).max(4),
  letterSpacing: num.min(-0.2).max(1),
  uppercase: z.boolean(),
};

const role = z.enum(['title', 'subtitle', 'heading', 'body', 'caption', 'label']);

const photo = z.object({
  ...base,
  type: z.literal('photo'),
  photoId: z.string().max(80).nullable(),
  crop: z.object({ zoom: num.min(1).max(10), fx: num.min(0).max(1), fy: num.min(0).max(1) }),
  shape: z.enum(['rect', 'ellipse']),
  radius: num.min(0).max(500),
  borderWidth: num.min(0).max(200),
  borderColor: color,
  filter: z.enum(['none', 'bw', 'sepia']),
});

const text = z.object({
  ...base,
  ...textStyle,
  type: z.literal('text'),
  text: z.string().max(5000),
  align: z.enum(['left', 'center', 'right']),
  valign: z.enum(['top', 'middle', 'bottom']),
  role: role.optional(),
});

const shape = z.object({
  ...base,
  type: z.literal('shape'),
  shape: z.enum(['rect', 'ellipse', 'line']),
  fill: color.nullable(),
  stroke: color.nullable(),
  strokeWidth: num.min(0).max(100),
  radius: num.min(0).max(500),
  opacity: num.min(0).max(1),
});

const ornament = z.object({
  ...base,
  type: z.literal('ornament'),
  ornament: ornamentId,
  color,
  opacity: num.min(0).max(1),
});

const element = z.discriminatedUnion('type', [photo, text, shape, ornament]);

const background = z.object({
  color,
  pattern: z.enum(['none', 'dots', 'grid', 'lines', 'frame', 'double-frame', 'corners']),
  patternColor: color,
});

const page = z.object({
  id: z.string().min(1).max(64),
  layoutId: z.string().max(64).nullable(),
  background,
  elements: z.array(element).max(120),
});

const style = z.object(textStyle);

export const documentSchema = z.object({
  schemaVersion: z.literal(1),
  templateId: z.string().max(64).nullable(),
  orientation: z.enum(['square', 'landscape', 'portrait']),
  size: z.object({ id: z.string().max(64), label: z.string().max(64), widthMm: num.min(50).max(600), heightMm: num.min(50).max(600) }),
  theme: z.object({
    text: z.object({ title: style, subtitle: style, heading: style, body: style, caption: style, label: style }),
    colors: z.object({ text: color, muted: color, accent: color, inverse: color }),
    background,
    photo: z.object({ borderWidth: num.min(0).max(200), borderColor: color, radius: num.min(0).max(500) }),
    palette: z.array(color).max(24),
  }),
  cover: page,
  backCover: page,
  pages: z.array(page).min(1).max(200),
  spineText: z.string().max(120),
});
