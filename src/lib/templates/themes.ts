import type { FontId } from '@/lib/album/fonts';
import type { Background, TextRole, TextStyle, Theme } from '@/lib/album/types';

interface Face {
  font: FontId;
  weight?: number;
  italic?: boolean;
  uppercase?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
}

interface ThemeSpec {
  display: Face;
  copy: Face;
  label?: Face;
  subtitle?: Face;
  /** Sizes in pt for an 8in page. */
  sizes?: Partial<Record<TextRole, number>>;
  ink: string;
  muted: string;
  accent: string;
  paper: string;
  inverse?: string;
  pattern?: Background['pattern'];
  patternColor?: string;
  photo?: Partial<Theme['photo']>;
  palette?: string[];
}

const DEFAULT_SIZES: Record<TextRole, number> = { title: 40, subtitle: 15, heading: 26, body: 9.5, caption: 8, label: 7 };

function style(face: Face, size: number, color: string, defaults: Partial<TextStyle> = {}): TextStyle {
  return {
    font: face.font,
    weight: face.weight ?? defaults.weight ?? 400,
    italic: face.italic ?? defaults.italic ?? false,
    size,
    color,
    lineHeight: face.lineHeight ?? defaults.lineHeight ?? 1.2,
    letterSpacing: face.letterSpacing ?? defaults.letterSpacing ?? 0,
    uppercase: face.uppercase ?? defaults.uppercase ?? false,
  };
}

export function makeTheme(spec: ThemeSpec): Theme {
  const s = { ...DEFAULT_SIZES, ...spec.sizes };
  const label: Face = spec.label ?? { font: spec.copy.font, weight: 500, uppercase: true, letterSpacing: 0.2 };
  const subtitle: Face = spec.subtitle ?? { ...spec.display, uppercase: false, letterSpacing: 0 };
  return {
    text: {
      title: style(spec.display, s.title, spec.ink, { lineHeight: 1.05 }),
      subtitle: style(subtitle, s.subtitle, spec.ink, { lineHeight: 1.25 }),
      heading: style(spec.display, s.heading, spec.ink, { lineHeight: 1.12 }),
      body: style({ ...spec.copy, uppercase: false, letterSpacing: spec.copy.letterSpacing ?? 0 }, s.body, spec.ink, { lineHeight: 1.6 }),
      caption: style({ ...spec.copy, uppercase: false }, s.caption, spec.muted, { lineHeight: 1.45 }),
      label: style(label, s.label, spec.muted, { lineHeight: 1.3 }),
    },
    colors: { text: spec.ink, muted: spec.muted, accent: spec.accent, inverse: spec.inverse ?? '#FFFFFF' },
    background: { color: spec.paper, pattern: spec.pattern ?? 'none', patternColor: spec.patternColor ?? spec.accent },
    photo: { borderWidth: 0, borderColor: '#FFFFFF', radius: 0, ...spec.photo },
    palette: spec.palette ?? [spec.paper, '#FFFFFF', spec.ink, spec.muted, spec.accent],
  };
}

export const THEMES = {
  romanticIvory: makeTheme({
    display: { font: 'cormorant', weight: 400, italic: true },
    subtitle: { font: 'cormorant', weight: 500, uppercase: true, letterSpacing: 0.24 },
    copy: { font: 'inter', weight: 300 },
    sizes: { title: 44, subtitle: 9, heading: 28 },
    ink: '#2E2A25',
    muted: '#857C70',
    accent: '#B39B7D',
    paper: '#FBF8F3',
    palette: ['#FBF8F3', '#F3ECE2', '#E9DFD2', '#2E2A25', '#B39B7D', '#A8B5A0', '#D9C2B6', '#FFFFFF'],
  }),
  editorialWhite: makeTheme({
    display: { font: 'playfair', weight: 400 },
    subtitle: { font: 'inter', weight: 500, uppercase: true, letterSpacing: 0.22 },
    copy: { font: 'inter', weight: 300 },
    label: { font: 'inter', weight: 600, uppercase: true, letterSpacing: 0.24 },
    sizes: { title: 46, subtitle: 7.5, heading: 30, body: 9 },
    ink: '#1C1B19',
    muted: '#7A766F',
    accent: '#9C7B58',
    paper: '#FFFFFF',
    palette: ['#FFFFFF', '#F5F2ED', '#1C1B19', '#7A766F', '#9C7B58', '#C9B79F'],
  }),
  noir: makeTheme({
    display: { font: 'cormorant', weight: 500, uppercase: true, letterSpacing: 0.18 },
    subtitle: { font: 'cormorant', weight: 400, italic: true },
    copy: { font: 'montserrat', weight: 300, letterSpacing: 0.02 },
    label: { font: 'montserrat', weight: 500, uppercase: true, letterSpacing: 0.3 },
    sizes: { title: 34, subtitle: 15, heading: 22, body: 8.5, caption: 7.5, label: 6.5 },
    ink: '#E9DCC4',
    muted: '#A89A82',
    accent: '#C9A96E',
    paper: '#161513',
    inverse: '#F4EBDD',
    photo: { borderWidth: 0 },
    palette: ['#161513', '#22201C', '#2E2A24', '#E9DCC4', '#C9A96E', '#8C7A5B'],
  }),
  kraftJournal: makeTheme({
    display: { font: 'caveat', weight: 700, lineHeight: 1 },
    subtitle: { font: 'specialelite', weight: 400, uppercase: true, letterSpacing: 0.12 },
    copy: { font: 'caveat', weight: 400, lineHeight: 1.25 },
    label: { font: 'specialelite', weight: 400, uppercase: true, letterSpacing: 0.12 },
    sizes: { title: 54, subtitle: 9, heading: 36, body: 15, caption: 15, label: 8 },
    ink: '#3B2F25',
    muted: '#6E5C4A',
    accent: '#C0643C',
    paper: '#E8DCC6',
    pattern: 'dots',
    patternColor: '#B9A585',
    palette: ['#E8DCC6', '#F3EBDD', '#D9C7A8', '#3B2F25', '#C0643C', '#5E7F8B', '#E3B04B', '#FFFFFF'],
  }),
  terra: makeTheme({
    display: { font: 'manrope', weight: 300, uppercase: true, letterSpacing: 0.28 },
    subtitle: { font: 'manrope', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'manrope', weight: 400 },
    label: { font: 'manrope', weight: 600, uppercase: true, letterSpacing: 0.3 },
    sizes: { title: 30, subtitle: 7.5, heading: 18, body: 8.5, caption: 7.5, label: 6.5 },
    ink: '#2A2824',
    muted: '#8A857C',
    accent: '#B07A55',
    paper: '#F7F5F0',
    palette: ['#F7F5F0', '#ECE7DE', '#2A2824', '#8A857C', '#B07A55', '#6F7E6B'],
  }),
  coastal: makeTheme({
    display: { font: 'dmserif', weight: 400 },
    subtitle: { font: 'manrope', weight: 600, uppercase: true, letterSpacing: 0.22 },
    copy: { font: 'manrope', weight: 400 },
    label: { font: 'manrope', weight: 700, uppercase: true, letterSpacing: 0.24 },
    sizes: { title: 46, subtitle: 7.5, heading: 30, body: 9, caption: 8, label: 6.5 },
    ink: '#1D3644',
    muted: '#6C7F87',
    accent: '#2F6F8A',
    paper: '#F4F1EA',
    palette: ['#F4F1EA', '#E4EEF0', '#1D3644', '#2F6F8A', '#D8B27A', '#FFFFFF'],
  }),
  homeModern: makeTheme({
    display: { font: 'montserrat', weight: 700, uppercase: false, letterSpacing: -0.01 },
    subtitle: { font: 'montserrat', weight: 500, uppercase: true, letterSpacing: 0.2 },
    copy: { font: 'inter', weight: 400 },
    label: { font: 'montserrat', weight: 500, uppercase: true, letterSpacing: 0.22 },
    sizes: { title: 36, subtitle: 7.5, heading: 22, body: 9, caption: 7.5, label: 6.5 },
    ink: '#2B2E2A',
    muted: '#7D857A',
    accent: '#6F8668',
    paper: '#FFFFFF',
    photo: { radius: 3 },
    palette: ['#FFFFFF', '#F1F4EF', '#E3E9E0', '#2B2E2A', '#6F8668', '#D9A75B'],
  }),
  vintage: makeTheme({
    display: { font: 'baskerville', weight: 400, italic: true },
    subtitle: { font: 'specialelite', weight: 400, uppercase: true, letterSpacing: 0.14 },
    copy: { font: 'baskerville', weight: 400 },
    label: { font: 'specialelite', weight: 400, uppercase: true, letterSpacing: 0.16 },
    sizes: { title: 36, subtitle: 8, heading: 24, body: 8.5, caption: 7.5, label: 7 },
    ink: '#3A2E22',
    muted: '#7D6B57',
    accent: '#9B6B43',
    paper: '#F3EBDD',
    pattern: 'double-frame',
    patternColor: '#B79E7F',
    photo: { borderWidth: 4, borderColor: '#FFFDF8' },
    palette: ['#F3EBDD', '#EADCC5', '#FFFDF8', '#3A2E22', '#9B6B43', '#6E7B5E'],
  }),
  editorialItalic: makeTheme({
    display: { font: 'playfair', weight: 400, italic: true },
    subtitle: { font: 'inter', weight: 500, uppercase: true, letterSpacing: 0.24 },
    copy: { font: 'inter', weight: 300 },
    label: { font: 'inter', weight: 600, uppercase: true, letterSpacing: 0.26 },
    sizes: { title: 50, subtitle: 7.5, heading: 32, body: 9, caption: 7.5, label: 6.5 },
    ink: '#201E1B',
    muted: '#86817A',
    accent: '#B4563E',
    paper: '#FDFCFA',
    palette: ['#FDFCFA', '#F2EEE8', '#201E1B', '#B4563E', '#86817A', '#E7D5C7'],
  }),
  blush: makeTheme({
    display: { font: 'greatvibes', weight: 400, lineHeight: 1.1 },
    subtitle: { font: 'cormorant', weight: 500, uppercase: true, letterSpacing: 0.26 },
    copy: { font: 'cormorant', weight: 400, lineHeight: 1.45 },
    label: { font: 'cormorant', weight: 600, uppercase: true, letterSpacing: 0.26 },
    sizes: { title: 52, subtitle: 9, heading: 36, body: 12, caption: 10.5, label: 7.5 },
    ink: '#5A3E3A',
    muted: '#9A7E77',
    accent: '#C98F86',
    paper: '#F8EEEA',
    palette: ['#F8EEEA', '#F2E1DA', '#FFFFFF', '#5A3E3A', '#C98F86', '#B9A07C'],
  }),
  playfulPastel: makeTheme({
    display: { font: 'fredoka', weight: 600, lineHeight: 1.05 },
    subtitle: { font: 'fredoka', weight: 400 },
    copy: { font: 'fredoka', weight: 400, lineHeight: 1.4 },
    label: { font: 'fredoka', weight: 600, uppercase: true, letterSpacing: 0.12 },
    sizes: { title: 44, subtitle: 14, heading: 28, body: 10.5, caption: 9.5, label: 7.5 },
    ink: '#3E4A5C',
    muted: '#7F8A99',
    accent: '#E58E73',
    paper: '#FDF6EC',
    photo: { radius: 14 },
    palette: ['#FDF6EC', '#E8F1F5', '#FBE4DA', '#E9F0DF', '#3E4A5C', '#E58E73', '#7FB3C8', '#F2C14E'],
  }),
  airy: makeTheme({
    display: { font: 'josefin', weight: 300, uppercase: true, letterSpacing: 0.18 },
    subtitle: { font: 'cormorant', weight: 400, italic: true },
    copy: { font: 'inter', weight: 300 },
    label: { font: 'josefin', weight: 600, uppercase: true, letterSpacing: 0.24 },
    sizes: { title: 30, subtitle: 16, heading: 20, body: 9, caption: 7.5, label: 6.5 },
    ink: '#33312E',
    muted: '#8D8881',
    accent: '#A9B7B0',
    paper: '#FFFFFF',
    palette: ['#FFFFFF', '#F4F3F0', '#EAF0EC', '#33312E', '#A9B7B0', '#D8C3A5'],
  }),
  celebration: makeTheme({
    display: { font: 'dmserif', weight: 400, italic: false },
    subtitle: { font: 'manrope', weight: 700, uppercase: true, letterSpacing: 0.22 },
    copy: { font: 'manrope', weight: 400 },
    label: { font: 'manrope', weight: 700, uppercase: true, letterSpacing: 0.24 },
    sizes: { title: 52, subtitle: 8, heading: 32, body: 9.5, caption: 8, label: 7 },
    ink: '#2B1E33',
    muted: '#7E6F86',
    accent: '#E0613E',
    paper: '#FFF7EC',
    palette: ['#FFF7EC', '#FDE3D4', '#F6D365', '#2B1E33', '#E0613E', '#8E6BBF', '#FFFFFF'],
  }),
  collegiate: makeTheme({
    display: { font: 'montserrat', weight: 700, uppercase: true, letterSpacing: 0.08 },
    subtitle: { font: 'baskerville', weight: 400, italic: true },
    copy: { font: 'baskerville', weight: 400 },
    label: { font: 'montserrat', weight: 500, uppercase: true, letterSpacing: 0.26 },
    sizes: { title: 34, subtitle: 14, heading: 20, body: 8.5, caption: 7.5, label: 6.5 },
    ink: '#1F2A44',
    muted: '#6D7489',
    accent: '#B8913F',
    paper: '#FBFAF6',
    palette: ['#FBFAF6', '#1F2A44', '#B8913F', '#E6E1D3', '#6D7489', '#FFFFFF'],
  }),
  emerald: makeTheme({
    display: { font: 'cormorant', weight: 500 },
    subtitle: { font: 'cormorant', weight: 400, italic: true },
    copy: { font: 'baskerville', weight: 400 },
    label: { font: 'montserrat', weight: 500, uppercase: true, letterSpacing: 0.3 },
    sizes: { title: 44, subtitle: 16, heading: 28, body: 8.5, caption: 7.5, label: 6.5 },
    ink: '#24332B',
    muted: '#73806F',
    accent: '#B39256',
    paper: '#F6F2E9',
    inverse: '#F1EADB',
    palette: ['#F6F2E9', '#1E2B24', '#E9E1CF', '#24332B', '#B39256', '#FFFFFF'],
  }),
  annual: makeTheme({
    display: { font: 'playfair', weight: 600 },
    subtitle: { font: 'inter', weight: 500, uppercase: true, letterSpacing: 0.22 },
    copy: { font: 'inter', weight: 400 },
    label: { font: 'inter', weight: 600, uppercase: true, letterSpacing: 0.24 },
    sizes: { title: 54, subtitle: 7.5, heading: 34, body: 8.5, caption: 7.5, label: 6.5 },
    ink: '#1E1D1B',
    muted: '#8A857E',
    accent: '#C4683F',
    paper: '#FAF8F4',
    palette: ['#FAF8F4', '#EFEAE2', '#1E1D1B', '#C4683F', '#5E7A8A', '#D9B26F'],
  }),
  slow: makeTheme({
    display: { font: 'cormorant', weight: 400 },
    subtitle: { font: 'inter', weight: 400, uppercase: true, letterSpacing: 0.26 },
    copy: { font: 'inter', weight: 300 },
    sizes: { title: 42, subtitle: 7, heading: 26, body: 8.5, caption: 7.5, label: 6.5 },
    ink: '#34312C',
    muted: '#8E887F',
    accent: '#A68C70',
    paper: '#F5F2EC',
    palette: ['#F5F2EC', '#EBE5DA', '#FFFFFF', '#34312C', '#A68C70', '#8C9A84'],
  }),
  notebook: makeTheme({
    display: { font: 'caveat', weight: 700, lineHeight: 1 },
    subtitle: { font: 'inter', weight: 500, uppercase: true, letterSpacing: 0.2 },
    copy: { font: 'caveat', weight: 400, lineHeight: 1.25 },
    label: { font: 'inter', weight: 600, uppercase: true, letterSpacing: 0.2 },
    sizes: { title: 50, subtitle: 7, heading: 34, body: 15, caption: 14, label: 6.5 },
    ink: '#2F3A40',
    muted: '#6B767C',
    accent: '#E07A5F',
    paper: '#F6F3EC',
    pattern: 'grid',
    patternColor: '#C9D3D6',
    palette: ['#F6F3EC', '#FFFFFF', '#E9EEF0', '#2F3A40', '#E07A5F', '#F2CC8F', '#81B29A'],
  }),
};
