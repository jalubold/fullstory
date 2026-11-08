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
  /** Captions default to the copy face; premium themes often set them in an italic serif. */
  caption?: Face;
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
      caption: style({ ...(spec.caption ?? spec.copy), uppercase: spec.caption?.uppercase ?? false }, s.caption, spec.muted, { lineHeight: 1.45 }),
      label: style(label, s.label, spec.muted, { lineHeight: 1.3 }),
    },
    colors: { text: spec.ink, muted: spec.muted, accent: spec.accent, inverse: spec.inverse ?? '#FFFFFF' },
    background: { color: spec.paper, pattern: spec.pattern ?? 'none', patternColor: spec.patternColor ?? spec.accent },
    photo: { borderWidth: 0, borderColor: '#FFFFFF', radius: 0, ...spec.photo },
    palette: spec.palette ?? [spec.paper, '#FFFFFF', spec.ink, spec.muted, spec.accent],
  };
}

export const THEMES = {
  /* Evermore — ivory, Garamond italic, quiet gold. */
  romanticIvory: makeTheme({
    display: { font: 'garamond', weight: 400, italic: true, letterSpacing: -0.01 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.34 },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.55 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.34 },
    sizes: { title: 42, subtitle: 7, heading: 28, body: 10.5, caption: 9, label: 6.5 },
    ink: '#2B2724',
    muted: '#8A8178',
    accent: '#A38B6A',
    paper: '#FBFAF7',
    palette: ['#FBFAF7', '#F2EEE8', '#E7E1D8', '#2B2724', '#A38B6A', '#8E9C8A', '#D9C7BD', '#FFFFFF'],
  }),
  /* The Vows — Bodoni headlines, Garamond text, gallery white. */
  editorialWhite: makeTheme({
    display: { font: 'bodoni', weight: 400, letterSpacing: -0.01 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.55 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.32 },
    sizes: { title: 46, subtitle: 7, heading: 32, body: 10, caption: 8.5, label: 6.5 },
    ink: '#141312',
    muted: '#77716A',
    accent: '#8C6E4E',
    paper: '#FFFFFF',
    palette: ['#FFFFFF', '#F4F1EC', '#141312', '#77716A', '#8C6E4E', '#CDBFAD'],
  }),
  /* Noir — black pages, tracked Bodoni capitals, champagne. */
  noir: makeTheme({
    display: { font: 'bodoni', weight: 400, uppercase: true, letterSpacing: 0.2 },
    subtitle: { font: 'garamond', weight: 400, italic: true },
    copy: { font: 'jost', weight: 300, letterSpacing: 0.02 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.36 },
    sizes: { title: 32, subtitle: 15, heading: 22, body: 8.5, caption: 9, label: 6.5 },
    ink: '#EEE7DB',
    muted: '#9E9586',
    accent: '#C2A36B',
    paper: '#121110',
    inverse: '#F4EEE4',
    palette: ['#121110', '#1D1B19', '#2A2724', '#EEE7DB', '#C2A36B', '#8C7A5B'],
  }),
  /* Wanderlust Journal — a field notebook: stone paper, Garamond italic, terracotta. */
  kraftJournal: makeTheme({
    display: { font: 'garamond', weight: 400, italic: true, lineHeight: 1.05 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.5 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.3 },
    sizes: { title: 46, subtitle: 7, heading: 30, body: 10.5, caption: 9.5, label: 6.5 },
    ink: '#2E2924',
    muted: '#857A6D',
    accent: '#A3532E',
    paper: '#F3EFE8',
    palette: ['#F3EFE8', '#E9E2D6', '#FFFFFF', '#2E2924', '#A3532E', '#56707A', '#C9A66B'],
  }),
  /* Terra — gallery minimalism: tracked Jost capitals, Garamond text. */
  terra: makeTheme({
    display: { font: 'jost', weight: 300, uppercase: true, letterSpacing: 0.34 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.34 },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.55 },
    caption: { font: 'jost', weight: 300, letterSpacing: 0.04 },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.36 },
    sizes: { title: 28, subtitle: 7, heading: 17, body: 9.5, caption: 7, label: 6 },
    ink: '#22211F',
    muted: '#8A857C',
    accent: '#A06F4E',
    paper: '#F7F6F2',
    palette: ['#F7F6F2', '#ECE9E2', '#22211F', '#8A857C', '#A06F4E', '#6F7E6B'],
  }),
  /* Coastlines — sea-glass navy, Garamond, airy margins. */
  coastal: makeTheme({
    display: { font: 'garamond', weight: 400 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.55 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.32 },
    sizes: { title: 48, subtitle: 7, heading: 32, body: 10.5, caption: 9, label: 6.5 },
    ink: '#1C2F3A',
    muted: '#6E7F86',
    accent: '#3F6F80',
    paper: '#F8F7F3',
    inverse: '#F4F1EA',
    palette: ['#F8F7F3', '#E5ECEE', '#1C2F3A', '#3F6F80', '#C9B08A', '#FFFFFF'],
  }),
  /* Home & Heart — warm modern: Fraunces, Jost, sage. */
  homeModern: makeTheme({
    display: { font: 'fraunces', weight: 400, letterSpacing: -0.015 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'jost', weight: 300, lineHeight: 1.6 },
    caption: { font: 'fraunces', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.3 },
    sizes: { title: 40, subtitle: 7, heading: 26, body: 9, caption: 8.5, label: 6.5 },
    ink: '#26302A',
    muted: '#7B857A',
    accent: '#64785D',
    paper: '#FFFFFF',
    inverse: '#F6F4EE',
    palette: ['#FFFFFF', '#F2F4EF', '#E3E8DF', '#26302A', '#64785D', '#C9A15F'],
  }),
  /* Sunday Album — heritage: Baskerville, small caps, deckled prints. */
  vintage: makeTheme({
    display: { font: 'baskerville', weight: 400, italic: true },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'baskerville', weight: 400, lineHeight: 1.55 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.32 },
    sizes: { title: 34, subtitle: 7, heading: 24, body: 8.5, caption: 9, label: 6.5 },
    ink: '#33291F',
    muted: '#7D6B57',
    accent: '#8E6440',
    paper: '#F4EEE4',
    pattern: 'double-frame',
    patternColor: '#CDBBA2',
    photo: { borderWidth: 4, borderColor: '#FFFDF8' },
    palette: ['#F4EEE4', '#EADFCD', '#FFFDF8', '#33291F', '#8E6440', '#6E7B5E'],
  }),
  /* Us, Lately — editorial italic: Bodoni italic, Garamond, deep terracotta. */
  editorialItalic: makeTheme({
    display: { font: 'bodoni', weight: 400, italic: true, letterSpacing: -0.01 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.55 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.32 },
    sizes: { title: 50, subtitle: 7, heading: 32, body: 10, caption: 9, label: 6.5 },
    ink: '#1D1B19',
    muted: '#85807A',
    accent: '#9E4434',
    paper: '#FCFBF9',
    inverse: '#FBF6F1',
    palette: ['#FCFBF9', '#F1ECE6', '#1D1B19', '#9E4434', '#85807A', '#E3D3C5'],
  }),
  /* Two of Us — blush stationery: Pinyon Script, Garamond, rosewood. */
  blush: makeTheme({
    display: { font: 'pinyon', weight: 400, lineHeight: 1.1 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.32 },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.5 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.32 },
    sizes: { title: 50, subtitle: 7, heading: 36, body: 11, caption: 9.5, label: 6.5 },
    ink: '#4A3431',
    muted: '#977C76',
    accent: '#B07A71',
    paper: '#F9F2EF',
    inverse: '#FBF4F1',
    palette: ['#F9F2EF', '#F1E2DC', '#FFFFFF', '#4A3431', '#B07A71', '#B9A07C'],
  }),
  /* Little Wonders — a premium nursery book: Fraunces, soft neutrals, one warm accent. */
  playfulPastel: makeTheme({
    display: { font: 'fraunces', weight: 600, letterSpacing: -0.02, lineHeight: 1.02 },
    subtitle: { font: 'fraunces', weight: 400, italic: true },
    copy: { font: 'jost', weight: 400, lineHeight: 1.55 },
    caption: { font: 'fraunces', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.26 },
    sizes: { title: 42, subtitle: 14, heading: 28, body: 9.5, caption: 9, label: 6.5 },
    ink: '#323A45',
    muted: '#808994',
    accent: '#C97C5D',
    paper: '#FBF8F3',
    inverse: '#FFFFFF',
    palette: ['#FBF8F3', '#EFF2F3', '#F5E8E1', '#ECEFE6', '#323A45', '#C97C5D', '#8FB0BF', '#E2C27A'],
  }),
  /* First Year — airy: tracked Jost, Garamond italic, sage. */
  airy: makeTheme({
    display: { font: 'jost', weight: 300, uppercase: true, letterSpacing: 0.26 },
    subtitle: { font: 'garamond', weight: 400, italic: true },
    copy: { font: 'jost', weight: 300, lineHeight: 1.6 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.3 },
    sizes: { title: 30, subtitle: 16, heading: 20, body: 9, caption: 9, label: 6.5 },
    ink: '#302E2B',
    muted: '#8D8881',
    accent: '#8FA59B',
    paper: '#FFFFFF',
    palette: ['#FFFFFF', '#F5F4F1', '#EAF0EC', '#302E2B', '#8FA59B', '#D8C3A5'],
  }),
  /* Thirty & Thriving — black-tie party: Bodoni italic, champagne. */
  celebration: makeTheme({
    display: { font: 'bodoni', weight: 400, italic: true, letterSpacing: -0.01 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.32 },
    copy: { font: 'jost', weight: 300, lineHeight: 1.6 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.34 },
    sizes: { title: 52, subtitle: 7, heading: 34, body: 9, caption: 9, label: 6.5 },
    ink: '#1B1A1F',
    muted: '#7E7884',
    accent: '#B08D57',
    paper: '#FFFFFF',
    inverse: '#F6EFE4',
    palette: ['#FFFFFF', '#F4EFE6', '#1B1A1F', '#B08D57', '#7E7884', '#E6D2B5'],
  }),
  /* Class of — collegiate: Bodoni capitals, Garamond, navy and gold. */
  collegiate: makeTheme({
    display: { font: 'bodoni', weight: 500, uppercase: true, letterSpacing: 0.14 },
    subtitle: { font: 'garamond', weight: 400, italic: true },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.55 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.32 },
    sizes: { title: 32, subtitle: 15, heading: 20, body: 10, caption: 9, label: 6.5 },
    ink: '#18223A',
    muted: '#6D7489',
    accent: '#A8883F',
    paper: '#FBFAF7',
    inverse: '#F3EEE2',
    palette: ['#FBFAF7', '#18223A', '#A8883F', '#E6E1D3', '#6D7489', '#FFFFFF'],
  }),
  /* Ten Years — anniversary: deep green cloth, Garamond, antique gold. */
  emerald: makeTheme({
    display: { font: 'garamond', weight: 400 },
    subtitle: { font: 'garamond', weight: 400, italic: true },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.55 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.34 },
    sizes: { title: 44, subtitle: 16, heading: 28, body: 10, caption: 9, label: 6.5 },
    ink: '#1F2E27',
    muted: '#738070',
    accent: '#A88A50',
    paper: '#F7F4EE',
    inverse: '#F1EADB',
    palette: ['#F7F4EE', '#1B2A23', '#E9E1CF', '#1F2E27', '#A88A50', '#FFFFFF'],
  }),
  /* Twelve Months — annual report: big Bodoni numerals, Jost, ochre. */
  annual: makeTheme({
    display: { font: 'bodoni', weight: 400, letterSpacing: -0.02 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'jost', weight: 300, lineHeight: 1.6 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.32 },
    sizes: { title: 56, subtitle: 7, heading: 36, body: 9, caption: 9, label: 6.5 },
    ink: '#1C1B19',
    muted: '#8A857E',
    accent: '#B4643C',
    paper: '#FAF9F6',
    inverse: '#FAF6EF',
    palette: ['#FAF9F6', '#EFEBE4', '#1C1B19', '#B4643C', '#5E7A8A', '#D9B26F'],
  }),
  /* Slow Days — linen and Garamond, very quiet. */
  slow: makeTheme({
    display: { font: 'garamond', weight: 400 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.32 },
    copy: { font: 'garamond', weight: 400, lineHeight: 1.6 },
    caption: { font: 'garamond', weight: 400, italic: true },
    label: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.32 },
    sizes: { title: 40, subtitle: 7, heading: 26, body: 10, caption: 9, label: 6.5 },
    ink: '#302D29',
    muted: '#8E887F',
    accent: '#9C8468',
    paper: '#F6F4EF',
    inverse: '#F6F2EA',
    palette: ['#F6F4EF', '#ECE7DE', '#FFFFFF', '#302D29', '#9C8468', '#8C9A84'],
  }),
  /* Little Things — modern notebook: Fraunces italic, Jost, clean paper. */
  notebook: makeTheme({
    display: { font: 'fraunces', weight: 400, italic: true, letterSpacing: -0.01 },
    subtitle: { font: 'jost', weight: 400, uppercase: true, letterSpacing: 0.3 },
    copy: { font: 'jost', weight: 300, lineHeight: 1.6 },
    caption: { font: 'fraunces', weight: 400, italic: true },
    label: { font: 'jost', weight: 500, uppercase: true, letterSpacing: 0.3 },
    sizes: { title: 46, subtitle: 7, heading: 30, body: 9.5, caption: 9.5, label: 6.5 },
    ink: '#2A3136',
    muted: '#737C82',
    accent: '#C0654E',
    paper: '#F8F7F4',
    palette: ['#F8F7F4', '#FFFFFF', '#ECEFF0', '#2A3136', '#C0654E', '#D9B77A', '#7FA08E'],
  }),
};
