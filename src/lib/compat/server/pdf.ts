import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import { fontkitAdapter } from '@/lib/server/pdf/fontkit';
import type { Locale } from '../i18n';
import { horizonLabels, relationLabels, type Blueprint, type Insight } from '../report';
import type { Horizon } from '../report-strings';
import { sectionTitles } from '../sections';
import { UI } from '../ui-strings';
import type { Relation } from '../types';

/**
 * Relationship Blueprint → A4 PDF. Drawn from the same Blueprint model as the
 * web page (vector text, embedded Fraunces + Manrope), so the two never disagree.
 */

const FONT_DIR = path.join(process.cwd(), 'src/assets/fonts');
const W = 595.28;
const H = 841.89;
const M = 56;
const CW = W - M * 2;

const hex = (h: string): RGB => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  ink: hex('#34252A'),
  soft: hex('#5A474D'),
  muted: hex('#7A6A6F'),
  wine: hex('#A94D65'),
  deep: hex('#5E2536'),
  blush: hex('#E8C6CC'),
  blushSoft: hex('#F5E6E9'),
  cream: hex('#FAF7F2'),
  line: hex('#EADFDC'),
  slate: hex('#2F6F9F'),
  white: rgb(1, 1, 1),
  sage: hex('#4F6F5C'),
  amber: hex('#9A6A1F'),
};
const RELATION_COLOR: Record<Relation, RGB> = { shared: C.sage, close: C.sage, complementary: C.wine, different: C.soft, tension: C.amber };

interface Fonts {
  serif: PDFFont;
  serifItalic: PDFFont;
  serifLight: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
}

/** Letter-spaced text (pdf-lib's drawText has no tracking option). */
function tracked(page: PDFPage, text: string, o: { x: number; y: number; size: number; font: PDFFont; color: RGB; spacing: number; opacity?: number }) {
  let x = o.x;
  for (const ch of text) {
    page.drawText(ch, { x, y: o.y, size: o.size, font: o.font, color: o.color, opacity: o.opacity });
    x += o.font.widthOfTextAtSize(ch, o.size) + o.spacing;
  }
}

function wrap(f: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(next, size) <= maxWidth || !line) line = next;
      else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

class Writer {
  page!: PDFPage;
  y = 0;
  pageNo = 0;
  constructor(
    readonly pdf: PDFDocument,
    readonly f: Fonts,
    readonly running: string,
    readonly locale: Locale,
  ) {}

  newPage() {
    this.page = this.pdf.addPage([W, H]);
    this.pageNo++;
    this.y = H - M - 18;
    tracked(this.page, this.running.toUpperCase(), { x: M, y: H - 34, size: 6.5, font: this.f.sansBold, color: this.muted(), spacing: 1.2 });
    this.page.drawLine({ start: { x: M, y: H - 42 }, end: { x: W - M, y: H - 42 }, thickness: 0.5, color: C.line });
    const folio = String(this.pageNo);
    this.page.drawText(folio, { x: W - M - this.f.serifItalic.widthOfTextAtSize(folio, 9), y: 30, size: 9, font: this.f.serifItalic, color: C.muted });
    this.page.drawText('Are We Compatible?', { x: M, y: 30, size: 8, font: this.f.serifItalic, color: C.muted });
  }

  muted() {
    return C.muted;
  }

  ensure(h: number) {
    if (this.y - h < M + 10) this.newPage();
  }

  gap(h: number) {
    this.y -= h;
  }

  textHeight(text: string, font: PDFFont, size: number, leading: number, width = CW) {
    return wrap(font, text, size, width).length * leading;
  }

  text(text: string, o: { font?: PDFFont; size?: number; leading?: number; color?: RGB; x?: number; width?: number; spacing?: number } = {}) {
    const font = o.font ?? this.f.sans;
    const size = o.size ?? 10;
    const leading = o.leading ?? size * 1.5;
    const width = o.width ?? CW;
    const x = o.x ?? M;
    for (const line of wrap(font, text, size, width)) {
      this.ensure(leading);
      if (o.spacing) tracked(this.page, line, { x, y: this.y - size, size, font, color: o.color ?? C.ink, spacing: o.spacing });
      else this.page.drawText(line, { x, y: this.y - size, size, font, color: o.color ?? C.ink });
      this.y -= leading;
    }
  }

  eyebrow(text: string, color = C.wine) {
    this.text(text.toUpperCase(), { font: this.f.sansBold, size: 7, leading: 12, color, spacing: 1.3 });
  }

  section(no: number, title: string, intro?: string[]) {
    this.newPage();
    const n = String(no).padStart(2, '0');
    this.page.drawText(n, { x: M, y: this.y - 30, size: 30, font: this.f.serifItalic, color: C.wine });
    const nx = M + this.f.serifItalic.widthOfTextAtSize(n, 30) + 12;
    const lines = wrap(this.f.serif, title, 24, CW - (nx - M));
    let ty = this.y - 26;
    for (const l of lines) {
      this.page.drawText(l, { x: nx, y: ty, size: 24, font: this.f.serif, color: C.ink });
      ty -= 28;
    }
    this.y = ty - 6;
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: W - M, y: this.y }, thickness: 0.6, color: C.blush });
    this.y -= 18;
    for (const p of intro ?? []) {
      this.text(p, { size: 10.5, leading: 16, color: C.soft });
      this.gap(6);
    }
    if (intro?.length) this.gap(6);
  }

  /** A titled block kept together when it fits on one page. */
  insight(i: Insight, names: Blueprint['names'], o: { showEvidence?: boolean; showTip?: boolean; compact?: boolean } = {}) {
    const body = o.compact ? i.body.slice(0, 1) : i.body;
    const tip = o.showTip !== false ? i.tip : undefined;
    const ev = o.showEvidence === false ? [] : (i.evidence ?? []);
    const est =
      this.textHeight(i.title, this.f.serif, 13, 17) +
      14 +
      body.reduce((s, p) => s + this.textHeight(p, this.f.sans, 9.5, 14) + 4, 0) +
      (tip ? this.textHeight(tip, this.f.sans, 9, 13, CW - 40) + 22 : 0) +
      ev.length * 46;
    if (est < H - 2 * M - 40) this.ensure(est + 8);
    this.text(i.title, { font: this.f.serif, size: 13, leading: 17 });
    if (i.relation) {
      const label = (i.id.startsWith('blind-') && i.relation === 'shared' ? UI[this.locale].blueprint.sharedBlindSpot : relationLabels(this.locale)[i.relation]).toUpperCase();
      this.text(label, { font: this.f.sansBold, size: 6.5, leading: 12, color: i.id.startsWith('blind-') ? C.amber : RELATION_COLOR[i.relation], spacing: 1 });
    } else this.gap(2);
    for (const p of body) {
      this.text(p, { size: 9.5, leading: 14, color: C.soft });
      this.gap(4);
    }
    if (tip) {
      const lines = wrap(this.f.sans, tip, 9, CW - 40);
      const h = lines.length * 13 + 14;
      this.ensure(h + 4);
      this.page.drawRectangle({ x: M, y: this.y - h, width: CW, height: h, color: C.blushSoft });
      tracked(this.page, UI[this.locale].blueprint.try.toUpperCase(), { x: M + 9, y: this.y - 16, size: 6.5, font: this.f.sansBold, color: C.wine, spacing: 1 });
      let ty = this.y - 16;
      for (const l of lines) {
        this.page.drawText(l, { x: M + 32, y: ty, size: 9, font: this.f.sans, color: C.ink });
        ty -= 13;
      }
      this.y -= h + 6;
    }
    for (const e of ev) {
      this.ensure(44);
      this.text(e.prompt, { font: this.f.sansBold, size: 7, leading: 11, color: C.muted });
      for (const r of ['a', 'b'] as const) this.person(r, names[r], e[r]);
      this.gap(2);
    }
    this.gap(12);
  }

  person(role: 'a' | 'b', name: string, text: string) {
    const lines = wrap(this.f.sans, `${name}: ${text}`, 8.8, CW - 18);
    this.ensure(lines.length * 12.5);
    this.page.drawCircle({ x: M + 4, y: this.y - 5.5, size: 3.2, color: role === 'a' ? C.wine : C.slate });
    for (const l of lines) {
      this.page.drawText(l, { x: M + 14, y: this.y - 8.5, size: 8.8, font: this.f.sans, color: C.ink });
      this.y -= 12.5;
    }
  }

  legend(names: Blueprint['names']) {
    this.ensure(16);
    let x = M;
    for (const r of ['a', 'b'] as const) {
      this.page.drawCircle({ x: x + 4, y: this.y - 5.5, size: 3.2, color: r === 'a' ? C.wine : C.slate });
      this.page.drawText(names[r], { x: x + 12, y: this.y - 8.5, size: 8.8, font: this.f.sans, color: C.ink });
      x += 28 + this.f.sans.widthOfTextAtSize(names[r], 8.8);
    }
    this.y -= 16;
  }

  bar(label: string, value: number) {
    this.ensure(26);
    this.page.drawText(label, { x: M, y: this.y - 10, size: 9.5, font: this.f.sansBold, color: C.ink });
    const v = `${value}%`;
    this.page.drawText(v, { x: W - M - this.f.serif.widthOfTextAtSize(v, 11), y: this.y - 10, size: 11, font: this.f.serif, color: C.ink });
    this.page.drawRectangle({ x: M, y: this.y - 19, width: CW, height: 4, color: C.blushSoft });
    this.page.drawRectangle({ x: M, y: this.y - 19, width: (CW * value) / 100, height: 4, color: C.wine });
    this.y -= 30;
  }
}

async function loadFonts(pdf: PDFDocument): Promise<Fonts> {
  pdf.registerFontkit(fontkitAdapter as never);
  const load = async (file: string) => pdf.embedFont(await fs.readFile(path.join(FONT_DIR, file)), { subset: true });
  const [serif, serifItalic, serifLight, sans, sansBold] = await Promise.all([load('fraunces-400.ttf'), load('fraunces-400i.ttf'), load('fraunces-300.ttf'), load('manrope-400.ttf'), load('manrope-700.ttf')]);
  return { serif, serifItalic, serifLight, sans, sansBold };
}

export async function renderBlueprintPdf(bp: Blueprint, generated: string, locale: Locale = bp.locale): Promise<Uint8Array> {
  const t = UI[locale].blueprint;
  const titles = sectionTitles(bp, locale);
  const relations = relationLabels(locale);
  const pdf = await PDFDocument.create();
  const { names, overview } = bp;
  pdf.setTitle(`The Relationship Blueprint — ${names.a} & ${names.b}`);
  pdf.setAuthor('Are We Compatible?');
  pdf.setSubject('A personalised relationship analysis, for reflection and entertainment.');
  pdf.setCreator('Are We Compatible?');
  const f = await loadFonts(pdf);
  const w = new Writer(pdf, f, `The Relationship Blueprint · ${names.a} & ${names.b}`, locale);

  // Cover
  const cover = pdf.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.deep });
  tracked(cover, 'THE RELATIONSHIP BLUEPRINT', { x: M, y: H - 120, size: 8, font: f.sansBold, color: C.blush, spacing: 2 });
  let cy = H - 190;
  for (const l of wrap(f.serif, `${names.a} & ${names.b}`, 48, CW)) {
    cover.drawText(l, { x: M, y: cy, size: 48, font: f.serif, color: C.white });
    cy -= 54;
  }
  cy -= 6;
  cover.drawText(overview.signature.title, { x: M, y: cy, size: 22, font: f.serifItalic, color: C.blush });
  cy -= 26;
  for (const l of wrap(f.sans, overview.signature.tagline, 11, CW)) {
    cover.drawText(l, { x: M, y: cy, size: 11, font: f.sans, color: C.white, opacity: 0.8 });
    cy -= 16;
  }
  const score = String(overview.alignment);
  cover.drawText(score, { x: M, y: 210, size: 96, font: f.serifLight, color: C.white });
  cover.drawText('%', { x: M + f.serifLight.widthOfTextAtSize(score, 96) + 4, y: 270, size: 28, font: f.serifLight, color: C.blush });
  tracked(cover, UI[locale].landing.preview.aligned.toUpperCase(), { x: M, y: 190, size: 7.5, font: f.sansBold, color: C.blush, spacing: 2 });
  cover.drawText(`${bp.context.label}  ·  ${generated}`, { x: M, y: 72, size: 9, font: f.sans, color: C.white, opacity: 0.7 });
  cover.drawText('Are We Compatible?', { x: W - M - f.serifItalic.widthOfTextAtSize('Are We Compatible?', 11), y: 72, size: 11, font: f.serifItalic, color: C.white });

  // 01 Overview
  w.section(1, titles.overview);
  w.text(overview.signature.description, { font: f.serif, size: 14, leading: 20 });
  w.gap(8);
  w.text(t.overviewStats({ same: overview.sameAnswers, total: overview.total, similarity: overview.similarity, complementary: overview.counts.complementary, tension: overview.counts.tension }), { size: 8.5, leading: 13, color: C.muted });
  w.gap(12);
  for (const p of overview.summary) {
    w.text(p, { size: 10.5, leading: 16, color: C.soft });
    w.gap(7);
  }
  w.gap(10);
  for (const d of bp.dimensions) w.bar(d.label, d.alignment);

  // 02–03 Profiles
  for (const role of ['a', 'b'] as const) {
    const p = bp.profiles[role];
    w.section(role === 'a' ? 2 : 3, t.profileTitle(p.name));
    w.text(p.headline, { font: f.serifItalic, size: 18, leading: 24, color: role === 'a' ? C.wine : C.slate });
    w.gap(4);
    w.text(p.summary, { size: 10.5, leading: 16 });
    w.gap(10);
    w.eyebrow(t.lovedThrough, C.muted);
    w.text(p.care.loved, { font: f.sansBold, size: 10, leading: 15 });
    w.gap(6);
    w.eyebrow(t.showsThrough, C.muted);
    w.text(p.care.shows, { font: f.sansBold, size: 10, leading: 15 });
    w.gap(12);
    w.eyebrow(t.ownAnswers(p.name), C.muted);
    w.gap(2);
    for (const t of p.traits) {
      w.text(`·  ${t}`, { size: 9.5, leading: 15, color: C.soft });
    }
  }

  // 04 Breakdown
  w.section(4, titles.breakdown, [t.breakdownIntro]);
  for (const a of bp.axes) {
    w.ensure(40);
    w.page.drawText(a.label, { x: M, y: w.y - 9, size: 9, font: f.sansBold, color: C.ink });
    const ly = w.y - 22;
    w.page.drawLine({ start: { x: M, y: ly }, end: { x: W - M, y: ly }, thickness: 0.6, color: C.line });
    for (const r of ['a', 'b'] as const) {
      const v = a[r] ?? 0;
      const x = M + ((Math.max(-1, Math.min(1, v)) + 1) / 2) * CW;
      w.page.drawCircle({ x, y: ly + (r === 'a' ? 3 : -3), size: 4.5, color: r === 'a' ? C.wine : C.slate, borderColor: C.white, borderWidth: 1 });
    }
    w.page.drawText(a.left, { x: M, y: ly - 13, size: 7.5, font: f.sans, color: C.muted });
    w.page.drawText(a.right, { x: W - M - f.sans.widthOfTextAtSize(a.right, 7.5), y: ly - 13, size: 7.5, font: f.sans, color: C.muted });
    w.y -= 46;
  }
  w.legend(names);
  for (const d of bp.dimensions) {
    w.gap(14);
    w.ensure(60);
    w.text(`${d.label} — ${d.alignment}%`, { font: f.serif, size: 15, leading: 20 });
    w.text(d.headline, { size: 8.5, leading: 13, color: C.muted });
    w.gap(6);
    for (const r of d.rows) {
      w.ensure(58);
      w.text(`${r.topic}  ·  ${relations[r.relation]}`, { font: f.sansBold, size: 9, leading: 13 });
      w.person('a', names.a, r.a);
      w.person('b', names.b, r.b);
      w.gap(7);
    }
  }

  // 05–06 Together / Differ
  w.section(5, titles.together, [t.togetherIntro]);
  if (!bp.together.length) w.text(t.togetherEmpty, { color: C.soft });
  // Topics covered by a deep dive (sections 07–10) get one line here; lifestyle topics get the full text.
  const covered = (i: Insight) => i.id === 'life-recharge' || (!!i.dimension && i.dimension !== 'lifestyle');
  for (const i of bp.together) w.insight(i, names, { showEvidence: false, showTip: false, compact: covered(i) });
  w.section(6, titles.differ, [t.differIntro]);
  if (!bp.differ.length) w.text(t.differEmpty, { color: C.soft });
  for (const i of bp.differ) w.insight(i, names, { showEvidence: false, showTip: !covered(i), compact: covered(i) });

  // 07–10 Deep dives
  [bp.emotional, bp.communication, bp.conflict, bp.future].forEach((dive, k) => {
    w.section(7 + k, dive.title, dive.intro);
    for (const i of dive.items) w.insight(i, names);
  });

  // 11 Strengths
  w.section(11, titles.strengths, [t.strengthsIntro]);
  for (const s of bp.strengths) w.insight({ ...s, relation: undefined, tip: undefined }, names, { showEvidence: false });

  // 12 Blind spots
  w.section(12, titles['blind-spots'], [t.blindIntro]);
  for (const b of bp.blindSpots) w.insight(b, names);

  // 13 Starters
  w.section(13, titles.starters, [t.startersIntro]);
  bp.starters.forEach((s, i) => {
    w.ensure(60);
    w.text(`${i + 1}.  ${s.prompt}`, { font: f.serif, size: 12.5, leading: 17 });
    w.text(`${s.topic}. ${s.why}`, { size: 8.5, leading: 13, color: C.muted, x: M + 16, width: CW - 16 });
    w.gap(10);
  });

  // 14 Action plan
  w.section(14, titles.actions, [t.actionsIntro]);
  const horizonLabel = horizonLabels(locale);
  for (const h of ['week', 'month', 'ongoing'] as Horizon[]) {
    const items = bp.actions.filter((a) => a.horizon === h);
    if (!items.length) continue;
    w.ensure(50);
    w.eyebrow(horizonLabel[h]);
    w.gap(4);
    for (const a of items) {
      w.ensure(50);
      w.page.drawRectangle({ x: M, y: w.y - 11, width: 9, height: 9, borderColor: C.wine, borderWidth: 1 });
      w.text(a.title, { font: f.sansBold, size: 10, leading: 14, x: M + 18, width: CW - 18 });
      w.text(a.body, { size: 9.5, leading: 14, color: C.soft, x: M + 18, width: CW - 18 });
      if (a.because) w.text(a.because, { size: 8.5, leading: 12.5, color: C.muted, x: M + 18, width: CW - 18 });
      w.gap(10);
    }
    w.gap(6);
  }
  w.gap(16);
  w.ensure(80);
  w.page.drawLine({ start: { x: M, y: w.y }, end: { x: W - M, y: w.y }, thickness: 0.5, color: C.line });
  w.gap(12);
  w.text(bp.disclaimer, { size: 8, leading: 12, color: C.muted });
  w.gap(4);
  w.text(t.versions(bp.questionSetVersion, bp.scoringVersion), { size: 7.5, leading: 11, color: C.muted });

  return pdf.save();
}
