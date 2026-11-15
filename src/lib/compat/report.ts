import { getContext } from './contexts';
import { questionMap } from './questions';
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
  horizon: 'This week' | 'This month' | 'Ongoing';
  title: string;
  body: string;
  because?: string;
}

export interface Blueprint {
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
  names: Record<Role, string>;
  context: { id: RelationshipContext; label: string };
  overview: Blueprint['overview'];
  dimensions: Array<Pick<DimensionView, 'id' | 'label' | 'alignment' | 'headline'>>;
  together: Insight | null;
  differ: Insight | null;
  counts: { differences: number; blindSpots: number; starters: number; actions: number; strengths: number };
}

/* ─────────────────────────────── Static copy ────────────────────────────── */

export const SIGNATURES: Record<SignatureId, Omit<Signature, 'id'>> = {
  mirror: {
    title: 'The Mirror Pair',
    tagline: 'You see the world through remarkably similar eyes.',
    description: 'Your answers line up across most of what you were asked. Shared instincts make everyday life feel easy — the thing to protect is curiosity, so that similarity never turns into assumption.',
  },
  puzzle: {
    title: 'The Puzzle Pieces',
    tagline: 'Your differences fit together.',
    description: 'Several of your differences are complementary: where one of you leans one way, the other fills the gap. You’re not identical — you interlock.',
  },
  anchors: {
    title: 'The Steady Anchors',
    tagline: 'Grounded, and aligned on much of what matters.',
    description: 'You agree on a lot, and where you differ the gaps are mostly small. That’s a steady base to build on.',
  },
  bridge: {
    title: 'The Bridge Builders',
    tagline: 'Different views, solid ways back to each other.',
    description: 'You see several things differently, but you’re well aligned on how you handle disagreement — the skill that matters most when views differ.',
  },
  explorers: {
    title: 'The Explorers',
    tagline: 'Two different worlds, curious about each other.',
    description: 'You approach many things differently, but few of those differences pull against each other. There’s a lot to discover in each other’s way of seeing things.',
  },
  conversation: {
    title: 'The Deep Divers',
    tagline: 'Plenty to talk about — and that’s where closeness grows.',
    description: 'Your answers point to several places where you could easily misunderstand each other. That’s not a verdict, it’s a map: couples who talk these things through openly often end up closer than couples who never had to.',
  },
  balanced: {
    title: 'The Balanced Pair',
    tagline: 'A mix of common ground and fresh perspectives.',
    description: 'You share a good amount and differ in places — a healthy mix of the familiar and the new.',
  },
};

export const RELATION_LABELS: Record<Relation, string> = {
  shared: 'Same answer',
  close: 'Close',
  complementary: 'Complementary',
  different: 'Different',
  tension: 'Worth discussing',
};

const AXIS_INFO: Record<AxisId, { label: string; left: string; right: string; pos: { adj: string; noun: string; desc: string }; neg: { adj: string; noun: string; desc: string } }> = {
  expression: {
    label: 'Expressing feelings',
    left: 'Private',
    right: 'Expressive',
    pos: { adj: 'Open-hearted', noun: 'Sharer', desc: 'puts feelings into words easily and values openness' },
    neg: { adj: 'Quietly deep', noun: 'Observer', desc: 'keeps feelings close and expresses care in quieter ways' },
  },
  togetherness: {
    label: 'Closeness & space',
    left: 'Independent',
    right: 'Together',
    pos: { adj: 'Close-knit', noun: 'Connector', desc: 'draws energy from closeness and shared time' },
    neg: { adj: 'Independent', noun: 'Free Spirit', desc: 'values independence and personal space' },
  },
  engagement: {
    label: 'Handling issues',
    left: 'Takes time',
    right: 'Addresses now',
    pos: { adj: 'Direct', noun: 'Resolver', desc: 'prefers to address issues head-on' },
    neg: { adj: 'Reflective', noun: 'Reflector', desc: 'needs time and calm before working through issues' },
  },
  structure: {
    label: 'Plans & spontaneity',
    left: 'Spontaneous',
    right: 'Planned',
    pos: { adj: 'Steady', noun: 'Planner', desc: 'feels secure with plans and predictability' },
    neg: { adj: 'Spontaneous', noun: 'Adventurer', desc: 'enjoys spontaneity and keeping things open' },
  },
  reassurance: {
    label: 'Reassurance',
    left: 'Self-assured',
    right: 'Likes reassurance',
    pos: { adj: 'Heartfelt', noun: 'Romantic', desc: 'feels most secure when care is expressed often' },
    neg: { adj: 'Self-assured', noun: 'Anchor', desc: 'feels secure without needing much reassurance' },
  },
  horizon: {
    label: 'Looking ahead',
    left: 'Present-focused',
    right: 'Future-focused',
    pos: { adj: 'Future-minded', noun: 'Builder', desc: 'thinks ahead and likes a sense of direction' },
    neg: { adj: 'Present-minded', noun: 'Savourer', desc: 'lives in the present and lets the future unfold' },
  },
};

const AXIS_ORDER: AxisId[] = ['expression', 'togetherness', 'engagement', 'structure', 'reassurance', 'horizon'];

const CARE: Record<string, { noun: string; action: (name: string) => string }> = {
  words: { noun: 'words', action: (n) => `tell ${n} one specific thing you appreciate, out loud, every day this week` },
  time: { noun: 'undivided time', action: (n) => `plan one phone-free hour with ${n} this week, just the two of you` },
  help: { noun: 'practical help', action: (n) => `take one task off ${n}’s plate this week without being asked` },
  touch: { noun: 'physical closeness', action: (n) => `offer ${n} more everyday affection — a hand on the back, a longer hug` },
  thought: { noun: 'thoughtful surprises', action: (n) => `leave ${n} one small, unexpected sign that you were thinking of them` },
};

const PROFILE_QUESTIONS = ['com-rhythm', 'com-raise', 'com-upset', 'emo-open', 'emo-reassure', 'life-recharge', 'life-plans', 'con-heat', 'con-repair', 'con-matters'];

export const DISCLAIMER =
  'This Blueprint is for reflection and entertainment. It is built from the 20 answers each of you gave at one moment in time — not from a validated psychological assessment — and it cannot predict whether a relationship will succeed. You know your relationship better than any questionnaire.';

/* ─────────────────────────────── Helpers ────────────────────────────────── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function dimensionHeadline(alignment: number): string {
  if (alignment >= 80) return 'Deeply in sync';
  if (alignment >= 65) return 'Mostly aligned';
  if (alignment >= 50) return 'Common ground with real differences';
  return 'Different perspectives worth exploring';
}

class Ctx {
  readonly q: Map<string, Question>;
  readonly byId: Map<string, QuestionComparison>;
  constructor(
    readonly set: QuestionSet,
    readonly result: ScoringResult,
    readonly names: Record<Role, string>,
  ) {
    this.q = questionMap(set);
    this.byId = new Map(result.comparisons.map((c) => [c.questionId, c]));
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
  /** "Sam feels… while Alex likes…" */
  contrast(c: QuestionComparison): string {
    const { a, b } = this.names;
    return `${a} ${this.opt(c.questionId, c.a).trait}. ${b} ${this.opt(c.questionId, c.b).trait}.`;
  }
  both(c: QuestionComparison): string {
    return `You both ${this.opt(c.questionId, c.a).plural}.`;
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
      return [ctx.contrast(c), 'Your answers sit right next to each other — a small difference in degree rather than a gap.'];
    case 'complementary':
      return [ctx.contrast(c), c.pairNote ?? q.insight.different];
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
  const ranked = AXIS_ORDER.map((id) => ({ id, v: axes[id] ?? 0 }))
    .filter((x) => Math.abs(x.v) >= 0.15)
    .sort((x, y) => Math.abs(y.v) - Math.abs(x.v) || AXIS_ORDER.indexOf(x.id) - AXIS_ORDER.indexOf(y.id));
  const pole = (x: { id: AxisId; v: number }) => (x.v >= 0 ? AXIS_INFO[x.id].pos : AXIS_INFO[x.id].neg);
  let headline = 'The Even-Keeled Partner';
  let summary = `${name}’s answers sit close to the middle on most spectrums — flexible, adaptable and hard to put in a box.`;
  if (ranked.length >= 2) {
    const [first, second] = ranked;
    headline = `The ${pole(second).adj} ${pole(first).noun}`;
    summary = `${name} ${pole(first).desc}, and ${pole(second).desc}.`;
  } else if (ranked.length === 1) {
    headline = `The ${pole(ranked[0]).noun}`;
    summary = `${name} ${pole(ranked[0]).desc}, and is fairly flexible otherwise.`;
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
        const note = c.relation === 'shared' ? (c.blindSpot ?? q.insight.shared) : c.relation === 'close' ? 'A small difference in degree.' : (c.pairNote ?? q.insight.different);
        return { questionId: q.id, topic: q.topic, prompt: q.prompt, a: ctx.opt(q.id, c.a).label, b: ctx.opt(q.id, c.b).label, relation: c.relation, alignment: c.alignment, note };
      });
    return { id: d.id, label: d.label, description: d.description, alignment: s.alignment, similarity: s.similarity, headline: dimensionHeadline(s.alignment), counts: s.counts, rows };
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
  const lovedLabel = ctx.opt('emo-loved', l.loved).label;
  const showsLabel = ctx.opt('emo-show', l.shows).label;
  const evidence: Evidence = {
    topic: 'Care, given and received',
    prompt: `What makes ${R} feel most loved · How ${G} naturally shows care`,
    a: l.receiver === 'a' ? lovedLabel : showsLabel,
    b: l.receiver === 'b' ? lovedLabel : showsLabel,
  };
  if (l.match) {
    return {
      id: `care-${l.receiver}`,
      title: `${G}’s care lands with ${R}`,
      body: [`${R} feels most loved through ${CARE[l.loved].noun} — and that’s exactly how ${G} naturally shows care. ${G}’s instinct already speaks ${R}’s language.`],
      relation: 'shared',
      evidence: [evidence],
    };
  }
  return {
    id: `care-${l.receiver}`,
    title: `Translating ${G}’s care for ${R}`,
    body: [
      `${R} feels most loved through ${CARE[l.loved].noun}, while ${G} naturally shows care through ${CARE[l.shows].noun}.`,
      `${G}’s love may be completely real and still be easy for ${R} to miss — and ${G} may wonder why it doesn’t always land.`,
    ],
    relation: 'different',
    tip: `${G}: ${CARE[l.loved].action(R)}. ${R}: try to notice ${CARE[l.shows].noun} as ${G}’s way of saying it.`,
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
  const insight: Insight = {
    id: 'pursue-withdraw',
    title: 'The chase-and-retreat risk',
    body: [
      `${P}’s answers lean toward addressing issues straight away, while ${W} tends to need time and calm first.`,
      `Under stress this can become a loop: the more ${P} presses, the more ${W} pulls back — and the more ${W} pulls back, the more ${P} presses. Neither of you is wrong; you’re each protecting the relationship in your own way.`,
    ],
    relation: 'tension',
    tip: `${W}: when you need a break, say when you’ll come back. ${P}: trust that time, and give the space fully.`,
    evidence,
  };
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
        title: 'When quiet reads as distance',
        body: [
          `${X} values reassurance and likes regular contact, while ${Y} prefers lighter contact during the day.`,
          `On busy days, ${Y}’s quiet may feel to ${X} like distance — even when nothing at all is wrong.`,
        ],
        relation: 'tension',
        tip: `${Y}: one small, unprompted message on busy days goes a long way. ${X}: when worry starts rising, ask rather than guess.`,
        evidence: [ctx.evidence(ctx.byId.get('emo-reassure')!), ctx.evidence(ctx.byId.get('com-rhythm')!)],
      });
    }
    if (has('com-upset', 'life-recharge') && ctx.answer(x, 'com-upset') === 'comfort' && ['alone', 'solo'].includes(ctx.answer(y, 'life-recharge'))) {
      out.push({
        id: `depleted-${x}`,
        title: 'When you’re both running low',
        body: [
          `When ${X} is upset, ${X} reaches for closeness — while ${Y} recharges with time alone.`,
          'In a hard week you might both be depleted at once and need opposite things, which can leave both of you feeling unmet.',
        ],
        relation: 'tension',
        tip: 'Agree on a “both depleted” plan in advance: a long hug first, then an hour apart, then dinner together.',
        evidence: [ctx.evidence(ctx.byId.get('com-upset')!), ctx.evidence(ctx.byId.get('life-recharge')!)],
      });
    }
  }
  return out;
}

function deepDive(ctx: Ctx, id: string, title: string, dims: DimensionId[], extraQuestions: string[], lead: Insight[], intro: string[]): DeepDive {
  const items = [
    ...lead,
    ...ctx.result.comparisons.filter((c) => dims.includes(c.dimension) || extraQuestions.includes(c.questionId)).map((c) => comparisonInsight(ctx, c)),
  ];
  return { id, title, intro, items };
}

function bandPhrase(alignment: number): string {
  if (alignment >= 80) return 'deeply in sync';
  if (alignment >= 65) return 'on largely the same page';
  if (alignment >= 50) return 'a real mix of common ground and difference';
  return 'seeing things quite differently — which makes it the richest area to talk about';
}

function dimensionIntro(ctx: Ctx, id: DimensionId): string {
  const d = ctx.result.dimensions.find((x) => x.id === id)!;
  const n = d.counts.shared + d.counts.close + d.counts.complementary;
  const total = Object.values(d.counts).reduce((s, v) => s + v, 0);
  const parts = [`In ${ctx.dimLabel(id).toLowerCase()} you’re ${d.alignment}% aligned: ${bandPhrase(d.alignment)}.`];
  const rest = total - n;
  parts.push(n === total ? `All ${total} of your answers here line up or fit together.` : n === 0 ? `None of your ${total} answers here line up closely.` : `${n} of your ${total} answers here line up or fit together, and ${rest} ${rest === 1 ? 'shows a different perspective' : 'show different perspectives'}.`);
  if (d.counts.tension) parts.push(d.counts.tension === 1 ? 'One topic could lead to misunderstandings if it stays unspoken.' : `${d.counts.tension} topics could lead to misunderstandings if they stay unspoken.`);
  return parts.join(' ');
}

function buildStrengths(ctx: Ctx, links: CareLink[]): Insight[] {
  const cands: Array<Insight & { score: number }> = [];
  for (const d of ctx.result.dimensions) {
    if (d.alignment >= 70) {
      const topics = ctx.result.comparisons.filter((c) => c.dimension === d.id && c.relation !== 'different' && c.relation !== 'tension' && !c.blindSpot).map((c) => ctx.q.get(c.questionId)!.topic.toLowerCase());
      if (topics.length < 2) continue;
      const list = topics.length === 2 ? topics.join(' and ') : `${topics.slice(0, -1).join(', ')} and ${topics[topics.length - 1]}`;
      cands.push({ id: `dim-${d.id}`, title: `Strong ground in ${ctx.dimLabel(d.id).toLowerCase()}`, body: [`You’re ${d.alignment}% aligned here, with answers that match or fit together on ${list}. It’s an area you can lean on when other things feel harder.`], score: d.alignment });
    }
  }
  for (const c of ctx.result.comparisons) {
    const q = ctx.q.get(c.questionId)!;
    if (c.relation === 'complementary') cands.push({ ...comparisonInsight(ctx, c), id: `comp-${c.questionId}`, title: `${q.topic}: a natural fit`, tip: undefined, score: 76 * c.weight });
    else if (c.relation === 'shared' && !c.blindSpot) {
      const boost = c.dimension === 'conflict' ? 82 : c.weight > 1 ? 80 : 60;
      cands.push({ ...comparisonInsight(ctx, c), id: `shared-${c.questionId}`, title: `Aligned on ${q.topic.toLowerCase()}`, tip: undefined, score: boost * c.weight });
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
  if (out.length < 3) {
    out.push({
      id: 'curiosity',
      title: 'Curiosity about each other',
      body: ['You both chose to sit down and answer twenty honest questions about how you love, argue and plan. Couples who stay curious about each other give themselves room to grow — and that’s exactly what you’re doing.'],
    });
  }
  return out;
}

function buildBlindSpots(ctx: Ctx): Insight[] {
  const out: Insight[] = [];
  for (const c of ctx.result.comparisons.filter((x) => x.blindSpot)) {
    const q = ctx.q.get(c.questionId)!;
    out.push({ id: `blind-${c.questionId}`, title: `Shared blind spot: ${q.topic.toLowerCase()}`, body: [c.relation === 'shared' ? ctx.both(c) : ctx.contrast(c), c.blindSpot!], relation: c.relation, tip: q.insight.bridge, evidence: [ctx.evidence(c)] });
  }
  const pw = pursueWithdraw(ctx);
  if (pw) out.push(pw.insight);
  out.push(...crossRules(ctx));
  if (!out.length) {
    out.push({
      id: 'none',
      title: 'No major blind spots stood out',
      body: [
        'None of your answer combinations matched the patterns we look for — shared avoidance, chase-and-retreat, or needs that quietly cancel each other out.',
        'One gentle caution: where you answered the same, it’s easy to assume you mean the same thing. Use a conversation starter or two on the topics you agree on, too.',
      ],
    });
  }
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
    const why = c.relation === 'shared' ? `You both answered “${la}”. The same words can hide different pictures — compare yours.` : `${A} answered “${la}”; ${B} answered “${lb}”.`;
    return { prompt: q.starter, topic: q.topic, why };
  });
}

function buildActions(ctx: Ctx, links: CareLink[], contextId: RelationshipContext): Action[] {
  const actions: Action[] = [];
  const used = new Set<string>();
  const { a: A, b: B } = ctx.names;
  const bridge = (c: QuestionComparison, horizon: Action['horizon']): Action => {
    used.add(c.questionId);
    const q = ctx.q.get(c.questionId)!;
    const because = c.relation === 'shared' ? `Because you both ${ctx.opt(q.id, c.a).plural}.` : `Because ${A} ${ctx.opt(q.id, c.a).trait}, and ${B} ${ctx.opt(q.id, c.b).trait}.`;
    return { horizon, title: q.topic, body: q.insight.bridge, because };
  };

  const mismatch = links.filter((l) => !l.match);
  if (mismatch.length) {
    const l = mismatch[0];
    const R = ctx.names[l.receiver];
    const G = ctx.names[l.giver];
    actions.push({ horizon: 'This week', title: `Love in ${R}’s language`, body: `${G}: ${CARE[l.loved].action(R)}.`, because: `Because ${R} feels most loved through ${CARE[l.loved].noun}, and ${G} naturally shows care through ${CARE[l.shows].noun}.` });
    if (mismatch[1]) {
      const m = mismatch[1];
      actions.push({ horizon: 'This week', title: `Love in ${ctx.names[m.receiver]}’s language`, body: `${ctx.names[m.giver]}: ${CARE[m.loved].action(ctx.names[m.receiver])}.`, because: `Because ${ctx.names[m.receiver]} feels most loved through ${CARE[m.loved].noun}.` });
    }
  } else if (links.length) {
    actions.push({ horizon: 'This week', title: 'Keep doing what works', body: 'Your ways of showing care already land with each other. This week, name one thing the other did that made you feel loved — out loud, specifically.', because: 'Because the way each of you shows care matches how the other feels most loved.' });
  }

  // The care questions are already covered by the "love in X's language" steps above.
  const differ = differOrder(ctx).filter((c) => !links.length || (c.questionId !== 'emo-loved' && c.questionId !== 'emo-show'));
  if (differ[0]) actions.push(bridge(differ[0], 'This week'));
  for (const c of differ.slice(1, 3)) actions.push(bridge(c, 'This month'));

  const blind = ctx.result.comparisons.find((c) => c.blindSpot && !used.has(c.questionId));
  if (blind) actions.push(bridge(blind, 'Ongoing'));
  else if (ctx.byId.has('con-heat') && !used.has('con-heat')) actions.push(bridge(ctx.byId.get('con-heat')!, 'Ongoing'));

  const ritual = getContext(contextId).ritual;
  actions.push({ horizon: 'Ongoing', title: ritual.title, body: ritual.body });
  return actions;
}

function buildSummary(ctx: Ctx, contextId: RelationshipContext): string[] {
  const { a: A, b: B } = ctx.names;
  const r = ctx.result;
  const sorted = [...r.dimensions].sort((x, y) => y.alignment - x.alignment);
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  const p1 =
    top.alignment === low.alignment
      ? `${A} and ${B}, you gave the same answer on ${r.overall.sameAnswers} of ${r.overall.total} questions, with an overall alignment of ${r.overall.alignment}% that’s remarkably even across all five areas.`
      : `${A} and ${B}, you gave the same answer on ${r.overall.sameAnswers} of ${r.overall.total} questions, with an overall alignment of ${r.overall.alignment}%. Your strongest common ground is ${ctx.dimLabel(top.id).toLowerCase()} (${top.alignment}%), and the area with the most to explore is ${ctx.dimLabel(low.id).toLowerCase()} (${low.alignment}%).`;
  const differences = r.overall.counts.different + r.overall.counts.tension + r.overall.counts.complementary;
  const c = r.overall.counts;
  const p2Parts: string[] = [];
  if (differences === 0) p2Parts.push('You didn’t differ on a single topic — rare, and worth celebrating, though it’s worth checking that the same words mean the same things to both of you.');
  else {
    p2Parts.push(`Of the ${differences} topics where your answers differ, ${c.complementary ? `${c.complementary} look complementary — they fit together rather than pull apart` : 'none are clear-cut complements, but most are simply different perspectives'}.`);
    if (c.tension) p2Parts.push(c.tension === 1 ? 'One could lead to a misunderstanding if it stays unspoken, and this Blueprint shows exactly where.' : `${c.tension} could lead to misunderstandings if they stay unspoken, and this Blueprint shows exactly where.`);
  }
  return [p1, p2Parts.join(' '), getContext(contextId).framing];
}

/* ─────────────────────────────── Entry points ───────────────────────────── */

export interface BuildInput {
  set: QuestionSet;
  context: RelationshipContext;
  names: Record<Role, string>;
  answers: Record<Role, Answers>;
}

export function buildBlueprint(input: BuildInput, result: ScoringResult = score(input.set, input.answers.a, input.answers.b)): Blueprint {
  const ctx = new Ctx(input.set, result, input.names);
  const links = careLinks(ctx);
  const ctxInfo = getContext(input.context);
  const signature = { id: result.signature, ...SIGNATURES[result.signature] };
  const pw = pursueWithdraw(ctx);

  const conflictIntro = [dimensionIntro(ctx, 'conflict')];
  if (pw) {
    const P = input.names[pw.pursuer];
    const W = input.names[pw.pursuer === 'a' ? 'b' : 'a'];
    conflictIntro.push(`One pattern to know about: ${P} tends to move toward a problem while ${W} steps back to think it over. It’s covered in Potential Blind Spots, with a simple way to handle it.`);
  }

  return {
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
    axes: AXIS_ORDER.map((id) => ({ id, label: AXIS_INFO[id].label, left: AXIS_INFO[id].left, right: AXIS_INFO[id].right, a: result.axes.a[id], b: result.axes.b[id] })),
    dimensions: buildDimensions(ctx),
    together: buildTogether(ctx),
    differ: buildDiffer(ctx),
    emotional: deepDive(ctx, 'emotional', 'Emotional Needs', ['emotional'], ['life-recharge'], links.map((l) => careInsight(ctx, l)), [
      dimensionIntro(ctx, 'emotional'),
      'This section looks at how each of you gives and receives care, how much reassurance and openness you need, and how you balance closeness with space.',
    ]),
    communication: deepDive(ctx, 'communication', 'Communication Dynamics', ['communication'], [], [], [dimensionIntro(ctx, 'communication')]),
    conflict: deepDive(ctx, 'conflict', 'Conflict & Understanding', ['conflict'], [], [], conflictIntro),
    future: deepDive(ctx, 'future', 'Future Expectations', ['future'], [], [], [dimensionIntro(ctx, 'future')]),
    strengths: buildStrengths(ctx, links),
    blindSpots: buildBlindSpots(ctx),
    starters: buildStarters(ctx),
    actions: buildActions(ctx, links, input.context),
    disclaimer: DISCLAIMER,
  };
}

export function buildPreview(bp: Blueprint): BlueprintPreview {
  const differ = bp.differ.find((d) => d.relation === 'tension') ?? bp.differ[0] ?? null;
  return {
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
