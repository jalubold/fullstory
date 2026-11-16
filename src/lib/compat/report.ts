import { getContext } from './contexts';
import { DEFAULT_LOCALE, type Locale } from './i18n';
import { questionMap } from './questions';
import { REPORT_STRINGS, type Horizon, type ReportStrings } from './report-strings';
import { score } from './scoring';
import type { Answers, AxisId, DimensionId, Question, QuestionComparison, QuestionOption, QuestionSet, Relation, RelationshipContext, Role, ScoringResult, SignatureId } from './types';

/**
 * Builds the Relationship Blueprint from the deterministic scoring result.
 *
 * Every insight is assembled from authored content attached to the options
 * both participants actually chose, and carries those answers as evidence.
 * Nothing here invents facts: if a rule's conditions aren't met by the
 * answers, the insight simply isn't included.
 */

export interface Evidence {
  topic: string;
  prompt: string;
  a: string;
  b: string;
}

export interface Insight {
  id: string;
  title: string;
  body: string[];
  relation?: Relation;
  tip?: string;
  evidence?: Evidence[];
  /** Set for insights about a single question. */
  dimension?: DimensionId;
}

export interface Signature {
  id: SignatureId;
  title: string;
  tagline: string;
  description: string;
}

export interface AxisView {
  id: AxisId;
  label: string;
  left: string;
  right: string;
  a: number | null;
  b: number | null;
}

export interface Profile {
  role: Role;
  name: string;
  headline: string;
  summary: string;
  traits: string[];
  care: { loved: string; shows: string };
}

export interface ComparisonRow {
  questionId: string;
  topic: string;
  prompt: string;
  a: string;
  b: string;
  relation: Relation;
  alignment: number;
  note: string;
}

export interface DimensionView {
  id: DimensionId;
  label: string;
  description: string;
  alignment: number;
  similarity: number;
  headline: string;
  counts: Record<Relation, number>;
  rows: ComparisonRow[];
}

export interface DeepDive {
  id: string;
  title: string;
  intro: string[];
  items: Insight[];
}

export interface Starter {
  prompt: string;
  topic: string;
  why: string;
}

export interface Action {
  horizon: Horizon;
  title: string;
  body: string;
  because?: string;
}

export interface Blueprint {
  locale: Locale;
  questionSetVersion: string;
  scoringVersion: string;
  names: Record<Role, string>;
  context: { id: RelationshipContext; label: string };
  overview: {
    signature: Signature;
    alignment: number;
    similarity: number;
    sameAnswers: number;
    total: number;
    counts: Record<Relation, number>;
    summary: string[];
  };
  profiles: Record<Role, Profile>;
  axes: AxisView[];
  dimensions: DimensionView[];
  together: Insight[];
  differ: Insight[];
  emotional: DeepDive;
  communication: DeepDive;
  conflict: DeepDive;
  future: DeepDive;
  strengths: Insight[];
  blindSpots: Insight[];
  starters: Starter[];
  actions: Action[];
  disclaimer: string;
}

/** What the free result shows. Built from the Blueprint so it never disagrees with it. */
export interface BlueprintPreview {
  locale: Locale;
  names: Record<Role, string>;
  context: { id: RelationshipContext; label: string };
  overview: Blueprint['overview'];
  dimensions: Array<Pick<DimensionView, 'id' | 'label' | 'alignment' | 'headline'>>;
  together: Insight | null;
  differ: Insight | null;
  counts: { differences: number; blindSpots: number; starters: number; actions: number; strengths: number };
}

/* ─────────────────────────────── Static copy ────────────────────────────── */

/** Signature titles and descriptions in a language. */
export const signatures = (locale: Locale = DEFAULT_LOCALE) => REPORT_STRINGS[locale].signatures;

/** Relation chip labels in a language. */
export const relationLabels = (locale: Locale = DEFAULT_LOCALE): Record<Relation, string> => REPORT_STRINGS[locale].relations;

/** Action-plan horizon labels in a language. */
export const horizonLabels = (locale: Locale = DEFAULT_LOCALE): Record<Horizon, string> => REPORT_STRINGS[locale].horizons;

const AXIS_ORDER: AxisId[] = ['expression', 'togetherness', 'engagement', 'structure', 'reassurance', 'horizon'];

const PROFILE_QUESTIONS = ['com-rhythm', 'com-raise', 'com-upset', 'emo-open', 'emo-reassure', 'life-recharge', 'life-plans', 'con-heat', 'con-repair', 'con-matters'];

/* ─────────────────────────────── Helpers ────────────────────────────────── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

class Ctx {
  readonly q: Map<string, Question>;
  readonly byId: Map<string, QuestionComparison>;
  readonly s: ReportStrings;
  constructor(
    readonly set: QuestionSet,
    readonly result: ScoringResult,
    readonly names: Record<Role, string>,
    readonly locale: Locale,
  ) {
    this.q = questionMap(set);
    this.byId = new Map(result.comparisons.map((c) => [c.questionId, c]));
    this.s = REPORT_STRINGS[locale];
  }
  opt(questionId: string, optionId: string): QuestionOption {
    return this.q.get(questionId)!.options.find((o) => o.id === optionId)!;
  }
  answer(role: Role, questionId: string): string {
    return this.byId.get(questionId)![role];
  }
  evidence(c: QuestionComparison): Evidence {
    const q = this.q.get(c.questionId)!;
    return { topic: q.topic, prompt: q.prompt, a: this.opt(q.id, c.a).label, b: this.opt(q.id, c.b).label };
  }
  /** "Sam feels… Alex likes…" */
  contrast(c: QuestionComparison): string {
    return this.s.contrast(this.names.a, this.opt(c.questionId, c.a).trait, this.names.b, this.opt(c.questionId, c.b).trait);
  }
  both(c: QuestionComparison): string {
    return this.s.both(this.opt(c.questionId, c.a).plural);
  }
  dimLabel(id: DimensionId) {
    return this.set.dimensions.find((d) => d.id === id)!.label;
  }
}

/** Plain-language reading of one comparison. */
function comparisonBody(ctx: Ctx, c: QuestionComparison): string[] {
  const q = ctx.q.get(c.questionId)!;
  switch (c.relation) {
    case 'shared':
      return [ctx.both(c), c.blindSpot ?? q.insight.shared];
    case 'close':
      return [ctx.contrast(c), ctx.s.closeNote];
    default:
      return [ctx.contrast(c), c.pairNote ?? q.insight.different];
  }
}

function comparisonInsight(ctx: Ctx, c: QuestionComparison): Insight {
  const q = ctx.q.get(c.questionId)!;
  const showTip = c.relation === 'different' || c.relation === 'tension' || !!c.blindSpot;
  return {
    id: c.questionId,
    dimension: c.dimension,
    title: q.topic,
    body: comparisonBody(ctx, c),
    relation: c.relation,
    tip: showTip ? q.insight.bridge : undefined,
    evidence: [ctx.evidence(c)],
  };
}

/* ─────────────────────────────── Sections ───────────────────────────────── */

function buildProfile(ctx: Ctx, role: Role): Profile {
  const name = ctx.names[role];
  const axes = ctx.result.axes[role];
  const P = ctx.s.profile;
  const ranked = AXIS_ORDER.map((id) => ({ id, v: axes[id] ?? 0 }))
    .filter((x) => Math.abs(x.v) >= 0.15)
    .sort((x, y) => Math.abs(y.v) - Math.abs(x.v) || AXIS_ORDER.indexOf(x.id) - AXIS_ORDER.indexOf(y.id));
  const pole = (x: { id: AxisId; v: number }) => (x.v >= 0 ? ctx.s.axes[x.id].pos : ctx.s.axes[x.id].neg);
  let headline = P.headlineNeutral;
  let summary = P.summaryNeutral(name);
  if (ranked.length >= 2) {
    const [first, second] = ranked;
    headline = P.headlineTwo(pole(second).adj, pole(first).noun);
    summary = P.summaryTwo(name, pole(first).desc, pole(second).desc);
  } else if (ranked.length === 1) {
    headline = P.headlineOne(pole(ranked[0]).noun);
    summary = P.summaryOne(name, pole(ranked[0]).desc);
  }
  const traits = PROFILE_QUESTIONS.filter((id) => ctx.q.has(id)).map((id) => `${name} ${ctx.opt(id, ctx.answer(role, id)).trait}.`);
  const loved = ctx.q.has('emo-loved') ? ctx.opt('emo-loved', ctx.answer(role, 'emo-loved')).label : '';
  const shows = ctx.q.has('emo-show') ? ctx.opt('emo-show', ctx.answer(role, 'emo-show')).label : '';
  return { role, name, headline, summary, traits, care: { loved, shows } };
}

function buildDimensions(ctx: Ctx): DimensionView[] {
  return ctx.set.dimensions.map((d) => {
    const s = ctx.result.dimensions.find((x) => x.id === d.id)!;
    const rows = ctx.result.comparisons
      .filter((c) => c.dimension === d.id)
      .map((c) => {
        const q = ctx.q.get(c.questionId)!;
        const note = c.relation === 'shared' ? (c.blindSpot ?? q.insight.shared) : c.relation === 'close' ? ctx.s.closeShort : (c.pairNote ?? q.insight.different);
        return { questionId: q.id, topic: q.topic, prompt: q.prompt, a: ctx.opt(q.id, c.a).label, b: ctx.opt(q.id, c.b).label, relation: c.relation, alignment: c.alignment, note };
      });
    return { id: d.id, label: d.label, description: d.description, alignment: s.alignment, similarity: s.similarity, headline: ctx.s.dimensionHeadline(s.alignment), counts: s.counts, rows };
  });
}

function buildTogether(ctx: Ctx): Insight[] {
  const rank = (c: QuestionComparison) => (c.relation === 'shared' ? 3 : c.relation === 'complementary' ? 2.6 : 1.2) * c.weight;
  return ctx.result.comparisons
    .filter((c) => (c.relation === 'shared' && !c.blindSpot) || c.relation === 'complementary' || c.relation === 'close')
    .sort((x, y) => rank(y) - rank(x))
    .slice(0, 7)
    .map((c) => comparisonInsight(ctx, c));
}

function differOrder(ctx: Ctx): QuestionComparison[] {
  const rank = (c: QuestionComparison) => (c.relation === 'tension' ? 3 : 2) * c.weight + (100 - c.alignment) / 1000;
  return ctx.result.comparisons.filter((c) => c.relation === 'different' || c.relation === 'tension').sort((x, y) => rank(y) - rank(x));
}

function buildDiffer(ctx: Ctx): Insight[] {
  return differOrder(ctx).map((c) => comparisonInsight(ctx, c));
}

interface CareLink {
  receiver: Role;
  giver: Role;
  loved: string;
  shows: string;
  match: boolean;
}

function careLinks(ctx: Ctx): CareLink[] {
  if (!ctx.q.has('emo-loved') || !ctx.q.has('emo-show')) return [];
  return (['a', 'b'] as Role[]).map((receiver) => {
    const giver: Role = receiver === 'a' ? 'b' : 'a';
    const loved = ctx.answer(receiver, 'emo-loved');
    const shows = ctx.answer(giver, 'emo-show');
    return { receiver, giver, loved, shows, match: loved === shows };
  });
}

function careInsight(ctx: Ctx, l: CareLink): Insight {
  const R = ctx.names[l.receiver];
  const G = ctx.names[l.giver];
  const care = ctx.s.care;
  const lovedLabel = ctx.opt('emo-loved', l.loved).label;
  const showsLabel = ctx.opt('emo-show', l.shows).label;
  const evidence: Evidence = {
    topic: ctx.s.careEvidence.topic,
    prompt: ctx.s.careEvidence.prompt(R, G),
    a: l.receiver === 'a' ? lovedLabel : showsLabel,
    b: l.receiver === 'b' ? lovedLabel : showsLabel,
  };
  if (l.match) {
    return { id: `care-${l.receiver}`, title: ctx.s.careMatch.title(G, R), body: [ctx.s.careMatch.body(R, G, care[l.loved].noun)], relation: 'shared', evidence: [evidence] };
  }
  return {
    id: `care-${l.receiver}`,
    title: ctx.s.careMismatch.title(G, R),
    body: ctx.s.careMismatch.body(R, G, care[l.loved].noun, care[l.shows].noun),
    relation: 'different',
    tip: ctx.s.careMismatch.tip(G, care[l.loved].action(R), R, care[l.shows].noun),
    evidence: [evidence],
  };
}

function pursueWithdraw(ctx: Ctx): { insight: Insight; pursuer: Role } | null {
  const ea = ctx.result.axes.a.engagement;
  const eb = ctx.result.axes.b.engagement;
  if (ea === null || eb === null || Math.abs(ea - eb) < 0.7) return null;
  const [pursuer, withdrawer]: Role[] = ea > eb ? ['a', 'b'] : ['b', 'a'];
  const hi = Math.max(ea, eb);
  const lo = Math.min(ea, eb);
  if (hi < 0.3 || lo > -0.1) return null;
  const P = ctx.names[pursuer];
  const W = ctx.names[withdrawer];
  const evidence = ['con-heat', 'com-raise', 'con-repair'].filter((id) => ctx.byId.has(id)).map((id) => ctx.evidence(ctx.byId.get(id)!));
  const insight: Insight = { id: 'pursue-withdraw', title: ctx.s.pursue.title, body: ctx.s.pursue.body(P, W), relation: 'tension', tip: ctx.s.pursue.tip(W, P), evidence };
  return { insight, pursuer };
}

function crossRules(ctx: Ctx): Insight[] {
  const out: Insight[] = [];
  const has = (...ids: string[]) => ids.every((id) => ctx.byId.has(id));
  for (const x of ['a', 'b'] as Role[]) {
    const y: Role = x === 'a' ? 'b' : 'a';
    const X = ctx.names[x];
    const Y = ctx.names[y];
    if (has('emo-reassure', 'com-rhythm') && ['lots', 'some'].includes(ctx.answer(x, 'emo-reassure')) && ['one', 'light'].includes(ctx.answer(y, 'com-rhythm')) && ['steady', 'checkins'].includes(ctx.answer(x, 'com-rhythm'))) {
      out.push({
        id: `quiet-distance-${x}`,
        title: ctx.s.quietDistance.title,
        body: ctx.s.quietDistance.body(X, Y),
        relation: 'tension',
        tip: ctx.s.quietDistance.tip(X, Y),
        evidence: [ctx.evidence(ctx.byId.get('emo-reassure')!), ctx.evidence(ctx.byId.get('com-rhythm')!)],
      });
    }
    if (has('com-upset', 'life-recharge') && ctx.answer(x, 'com-upset') === 'comfort' && ['alone', 'solo'].includes(ctx.answer(y, 'life-recharge'))) {
      out.push({
        id: `depleted-${x}`,
        title: ctx.s.depleted.title,
        body: ctx.s.depleted.body(X, Y),
        relation: 'tension',
        tip: ctx.s.depleted.tip,
        evidence: [ctx.evidence(ctx.byId.get('com-upset')!), ctx.evidence(ctx.byId.get('life-recharge')!)],
      });
    }
  }
  return out;
}

function deepDive(ctx: Ctx, id: string, title: string, dims: DimensionId[], extraQuestions: string[], lead: Insight[], intro: string[]): DeepDive {
  const items = [...lead, ...ctx.result.comparisons.filter((c) => dims.includes(c.dimension) || extraQuestions.includes(c.questionId)).map((c) => comparisonInsight(ctx, c))];
  return { id, title, intro, items };
}

function dimensionIntro(ctx: Ctx, id: DimensionId): string {
  const d = ctx.result.dimensions.find((x) => x.id === id)!;
  const matched = d.counts.shared + d.counts.close + d.counts.complementary;
  const total = Object.values(d.counts).reduce((s, v) => s + v, 0);
  return ctx.s.dimensionIntro({ label: ctx.dimLabel(id), alignment: d.alignment, matched, total, tension: d.counts.tension });
}

function buildStrengths(ctx: Ctx, links: CareLink[]): Insight[] {
  const S = ctx.s.strengths;
  const cands: Array<Insight & { score: number }> = [];
  for (const d of ctx.result.dimensions) {
    if (d.alignment >= 70) {
      const topics = ctx.result.comparisons.filter((c) => c.dimension === d.id && c.relation !== 'different' && c.relation !== 'tension' && !c.blindSpot).map((c) => ctx.q.get(c.questionId)!.topic.toLowerCase());
      if (topics.length < 2) continue;
      cands.push({ id: `dim-${d.id}`, title: S.dimTitle(ctx.dimLabel(d.id)), body: [S.dimBody(d.alignment, topics)], score: d.alignment });
    }
  }
  for (const c of ctx.result.comparisons) {
    const q = ctx.q.get(c.questionId)!;
    if (c.relation === 'complementary') cands.push({ ...comparisonInsight(ctx, c), id: `comp-${c.questionId}`, title: S.complementTitle(q.topic), tip: undefined, score: 76 * c.weight });
    else if (c.relation === 'shared' && !c.blindSpot) {
      const boost = c.dimension === 'conflict' ? 82 : c.weight > 1 ? 80 : 60;
      cands.push({ ...comparisonInsight(ctx, c), id: `shared-${c.questionId}`, title: S.sharedTitle(q.topic), tip: undefined, score: boost * c.weight });
    }
  }
  for (const l of links.filter((x) => x.match)) cands.push({ ...careInsight(ctx, l), score: 88 });
  const seen = new Set<string>();
  const out: Insight[] = cands
    .sort((x, y) => y.score - x.score)
    .filter((c) => (seen.has(c.title) ? false : (seen.add(c.title), true)))
    .slice(0, 5)
    .map((c) => {
      const copy: Partial<typeof c> = { ...c };
      delete copy.score;
      return copy as Insight;
    });
  if (out.length < 3) out.push({ id: 'curiosity', title: S.curiosity.title, body: [S.curiosity.body] });
  return out;
}

function buildBlindSpots(ctx: Ctx): Insight[] {
  const out: Insight[] = [];
  for (const c of ctx.result.comparisons.filter((x) => x.blindSpot)) {
    const q = ctx.q.get(c.questionId)!;
    out.push({ id: `blind-${c.questionId}`, title: ctx.s.blind.title(q.topic), body: [c.relation === 'shared' ? ctx.both(c) : ctx.contrast(c), c.blindSpot!], relation: c.relation, tip: q.insight.bridge, evidence: [ctx.evidence(c)] });
  }
  const pw = pursueWithdraw(ctx);
  if (pw) out.push(pw.insight);
  out.push(...crossRules(ctx));
  if (!out.length) out.push({ id: 'none', title: ctx.s.blind.noneTitle, body: ctx.s.blind.noneBody });
  return out;
}

function buildStarters(ctx: Ctx): Starter[] {
  const { a: A, b: B } = ctx.names;
  const rank = (c: QuestionComparison) => (c.relation === 'tension' ? 4 : c.blindSpot ? 3.5 : c.relation === 'different' ? 3 : c.relation === 'complementary' ? 2 : c.relation === 'close' ? 1.5 : 1) * c.weight;
  const picked = [...ctx.result.comparisons].sort((x, y) => rank(y) - rank(x)).slice(0, 8);
  return picked.map((c) => {
    const q = ctx.q.get(c.questionId)!;
    const la = ctx.opt(q.id, c.a).label;
    const lb = ctx.opt(q.id, c.b).label;
    const why = c.relation === 'shared' ? ctx.s.starters.whyShared(la) : ctx.s.starters.whyDifferent(A, la, B, lb);
    return { prompt: q.starter, topic: q.topic, why };
  });
}

function buildActions(ctx: Ctx, links: CareLink[], contextId: RelationshipContext): Action[] {
  const T = ctx.s.actions;
  const care = ctx.s.care;
  const actions: Action[] = [];
  const used = new Set<string>();
  const { a: A, b: B } = ctx.names;
  const bridge = (c: QuestionComparison, horizon: Horizon): Action => {
    used.add(c.questionId);
    const q = ctx.q.get(c.questionId)!;
    const because = c.relation === 'shared' ? T.becauseShared(ctx.opt(q.id, c.a).plural) : T.becauseDifferent(A, ctx.opt(q.id, c.a).trait, B, ctx.opt(q.id, c.b).trait);
    return { horizon, title: q.topic, body: q.insight.bridge, because };
  };

  const mismatch = links.filter((l) => !l.match);
  if (mismatch.length) {
    const l = mismatch[0];
    const R = ctx.names[l.receiver];
    const G = ctx.names[l.giver];
    actions.push({ horizon: 'week', title: T.loveTitle(R), body: T.loveBody(G, care[l.loved].action(R)), because: T.loveBecause(R, care[l.loved].noun, G, care[l.shows].noun) });
    if (mismatch[1]) {
      const m = mismatch[1];
      const R2 = ctx.names[m.receiver];
      actions.push({ horizon: 'week', title: T.loveTitle(R2), body: T.loveBody(ctx.names[m.giver], care[m.loved].action(R2)), because: T.loveBecauseShort(R2, care[m.loved].noun) });
    }
  } else if (links.length) {
    actions.push({ horizon: 'week', title: T.keepDoing.title, body: T.keepDoing.body, because: T.keepDoing.because });
  }

  // The care questions are already covered by the "love in X's language" steps above.
  const differ = differOrder(ctx).filter((c) => !links.length || (c.questionId !== 'emo-loved' && c.questionId !== 'emo-show'));
  if (differ[0]) actions.push(bridge(differ[0], 'week'));
  for (const c of differ.slice(1, 3)) actions.push(bridge(c, 'month'));

  const blind = ctx.result.comparisons.find((c) => c.blindSpot && !used.has(c.questionId));
  if (blind) actions.push(bridge(blind, 'ongoing'));
  else if (ctx.byId.has('con-heat') && !used.has('con-heat')) actions.push(bridge(ctx.byId.get('con-heat')!, 'ongoing'));

  const ritual = getContext(contextId, ctx.locale).ritual;
  actions.push({ horizon: 'ongoing', title: ritual.title, body: ritual.body });
  return actions;
}

function buildSummary(ctx: Ctx, contextId: RelationshipContext): string[] {
  const { a, b } = ctx.names;
  const r = ctx.result;
  const S = ctx.s.summary;
  const sorted = [...r.dimensions].sort((x, y) => y.alignment - x.alignment);
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  const p1 =
    top.alignment === low.alignment
      ? S.p1Even(a, b, r.overall.sameAnswers, r.overall.total, r.overall.alignment)
      : S.p1({ a, b, same: r.overall.sameAnswers, total: r.overall.total, alignment: r.overall.alignment, top: ctx.dimLabel(top.id), topScore: top.alignment, low: ctx.dimLabel(low.id), lowScore: low.alignment });
  const c = r.overall.counts;
  const differences = c.different + c.tension + c.complementary;
  const p2 = differences === 0 ? S.noDifferences : [S.differences(differences, c.complementary), c.tension ? S.tension(c.tension) : ''].filter(Boolean).join(' ');
  return [p1, p2, getContext(contextId, ctx.locale).framing];
}

/* ─────────────────────────────── Entry points ───────────────────────────── */

export interface BuildInput {
  /** The question set in the reader's language (see getQuestionSet(version, locale)). */
  set: QuestionSet;
  context: RelationshipContext;
  names: Record<Role, string>;
  answers: Record<Role, Answers>;
  locale?: Locale;
}

export function buildBlueprint(input: BuildInput, result: ScoringResult = score(input.set, input.answers.a, input.answers.b)): Blueprint {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const ctx = new Ctx(input.set, result, input.names, locale);
  const S = ctx.s;
  const links = careLinks(ctx);
  const ctxInfo = getContext(input.context, locale);
  const signature = { id: result.signature, ...S.signatures[result.signature] };
  const pw = pursueWithdraw(ctx);

  const conflictIntro = [dimensionIntro(ctx, 'conflict')];
  if (pw) conflictIntro.push(S.conflictPattern(input.names[pw.pursuer], input.names[pw.pursuer === 'a' ? 'b' : 'a']));

  return {
    locale,
    questionSetVersion: result.questionSetVersion,
    scoringVersion: result.scoringVersion,
    names: input.names,
    context: { id: ctxInfo.id, label: ctxInfo.label },
    overview: {
      signature,
      alignment: result.overall.alignment,
      similarity: result.overall.similarity,
      sameAnswers: result.overall.sameAnswers,
      total: result.overall.total,
      counts: result.overall.counts,
      summary: buildSummary(ctx, input.context),
    },
    profiles: { a: buildProfile(ctx, 'a'), b: buildProfile(ctx, 'b') },
    axes: AXIS_ORDER.map((id) => ({ id, label: S.axes[id].label, left: S.axes[id].left, right: S.axes[id].right, a: result.axes.a[id], b: result.axes.b[id] })),
    dimensions: buildDimensions(ctx),
    together: buildTogether(ctx),
    differ: buildDiffer(ctx),
    emotional: deepDive(ctx, 'emotional', S.deepDives.emotional, ['emotional'], ['life-recharge'], links.map((l) => careInsight(ctx, l)), [dimensionIntro(ctx, 'emotional'), S.emotionalIntro]),
    communication: deepDive(ctx, 'communication', S.deepDives.communication, ['communication'], [], [], [dimensionIntro(ctx, 'communication')]),
    conflict: deepDive(ctx, 'conflict', S.deepDives.conflict, ['conflict'], [], [], conflictIntro),
    future: deepDive(ctx, 'future', S.deepDives.future, ['future'], [], [], [dimensionIntro(ctx, 'future')]),
    strengths: buildStrengths(ctx, links),
    blindSpots: buildBlindSpots(ctx),
    starters: buildStarters(ctx),
    actions: buildActions(ctx, links, input.context),
    disclaimer: S.disclaimer,
  };
}

export function buildPreview(bp: Blueprint): BlueprintPreview {
  const differ = bp.differ.find((d) => d.relation === 'tension') ?? bp.differ[0] ?? null;
  return {
    locale: bp.locale,
    names: bp.names,
    context: bp.context,
    overview: bp.overview,
    dimensions: bp.dimensions.map(({ id, label, alignment, headline }) => ({ id, label, alignment, headline })),
    together: bp.together[0] ?? null,
    // The teaser shows the topic and both perspectives, but holds back the bridge tip.
    differ: differ ? { ...differ, tip: undefined } : null,
    counts: { differences: bp.differ.length, blindSpots: bp.blindSpots.filter((b) => b.id !== 'none').length, starters: bp.starters.length, actions: bp.actions.length, strengths: bp.strengths.length },
  };
}

export { cap };
