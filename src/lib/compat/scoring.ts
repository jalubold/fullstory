import { questionMap } from './questions';
import type { Answers, AxisId, DimensionId, DimensionScore, Question, QuestionComparison, QuestionSet, Relation, Role, ScoringResult, SignatureId } from './types';

/**
 * Deterministic, transparent scoring. Same answers in → same result out.
 *
 * For every question the two answers are compared and given:
 *
 *  - a RELATION, which describes how the answers meet:
 *      shared         identical answers
 *      close          neighbouring points on a scale
 *      complementary  different answers that tend to fit together (authored pairs)
 *      different      a neutral difference in perspective
 *      tension        answers that easily lead to misunderstanding
 *                     (authored friction pairs, or opposite ends of a scale)
 *
 *  - a SIMILARITY (0–1): purely how alike the answers are. Scale questions use
 *    distance along the scale; choice questions are 1 if identical, else 0.
 *
 *  - an ALIGNMENT (0–100): how well the answers sit together. Identical isn't
 *    automatically best and different isn't automatically bad:
 *      shared 100 · shared blind spot 70 · complementary 80 · close 100−70·d/max
 *      different 45 (or the question's differentScore for needs questions)
 *      tension 15
 *
 * Dimension alignment = weighted mean of its questions' alignment.
 * Overall alignment   = mean of the five dimensions.
 * Overall similarity  = weighted mean similarity across all questions (the
 *                       "similarity indicator"), reported alongside the number
 *                       of identical answers.
 *
 * Results are for reflection and entertainment; they are not a validated
 * psychological measure or a prediction of relationship success.
 */

export const SCORING_VERSION = '1.0.0';

const ALIGNMENT = { shared: 100, sharedBlindSpot: 70, complementary: 80, different: 45, tension: 15 } as const;

const AXES: AxisId[] = ['expression', 'togetherness', 'engagement', 'structure', 'reassurance', 'horizon'];

const emptyCounts = (): Record<Relation, number> => ({ shared: 0, close: 0, complementary: 0, different: 0, tension: 0 });

const pairMatch = (pairs: Question['complements'], a: string, b: string) => pairs?.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a)) ?? null;

export function compareQuestion(q: Question, a: string, b: string): QuestionComparison {
  const weight = q.weight ?? 1;
  const ia = q.options.findIndex((o) => o.id === a);
  const ib = q.options.findIndex((o) => o.id === b);
  if (ia < 0 || ib < 0) throw new Error(`Invalid answer for ${q.id}`);
  const blind = q.blindSpots?.find((r) => r.options.includes(a) && r.options.includes(b)) ?? null;
  const base = { questionId: q.id, dimension: q.dimension, a, b, weight, blindSpot: blind?.note ?? null };

  if (a === b) {
    return { ...base, relation: 'shared', similarity: 1, alignment: blind ? ALIGNMENT.sharedBlindSpot : ALIGNMENT.shared, pairNote: null };
  }

  const complement = pairMatch(q.complements, a, b);
  const friction = pairMatch(q.frictions, a, b);

  if (q.kind === 'scale') {
    const max = q.options.length - 1;
    const d = Math.abs(ia - ib);
    const similarity = 1 - d / max;
    const tensionAt = q.tensionAt ?? max;
    if (friction || d >= tensionAt) return { ...base, relation: 'tension', similarity, alignment: ALIGNMENT.tension, pairNote: friction?.note ?? null };
    if (complement) return { ...base, relation: 'complementary', similarity, alignment: ALIGNMENT.complementary, pairNote: complement.note };
    const alignment = Math.round(100 - (70 * d) / max);
    return { ...base, relation: d === 1 ? 'close' : 'different', similarity, alignment, pairNote: null };
  }

  if (friction) return { ...base, relation: 'tension', similarity: 0, alignment: ALIGNMENT.tension, pairNote: friction.note };
  if (complement) return { ...base, relation: 'complementary', similarity: 0, alignment: ALIGNMENT.complementary, pairNote: complement.note };
  return { ...base, relation: 'different', similarity: 0, alignment: q.differentScore ?? ALIGNMENT.different, pairNote: null };
}

const weightedMean = (items: Array<{ v: number; w: number }>) => {
  const w = items.reduce((s, x) => s + x.w, 0);
  return w ? items.reduce((s, x) => s + x.v * x.w, 0) / w : 0;
};

/** A person's position on each axis (mean of their answers' nudges), or null when no answer touches it. */
export function axisPositions(set: QuestionSet, answers: Answers): Record<AxisId, number | null> {
  const sums = Object.fromEntries(AXES.map((a) => [a, [] as number[]])) as Record<AxisId, number[]>;
  for (const q of set.questions) {
    const opt = q.options.find((o) => o.id === answers[q.id]);
    // Every question that can move an axis counts, so a neutral answer pulls toward the middle.
    const touched = new Set(q.options.flatMap((o) => Object.keys(o.axes ?? {}) as AxisId[]));
    for (const axis of touched) sums[axis].push(opt?.axes?.[axis] ?? 0);
  }
  return Object.fromEntries(AXES.map((a) => [a, sums[a].length ? round2(sums[a].reduce((s, v) => s + v, 0) / sums[a].length) : null])) as Record<AxisId, number | null>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function pickSignature(r: Pick<ScoringResult, 'overall' | 'dimensions'>): SignatureId {
  const { alignment, similarity, counts } = r.overall;
  const conflict = r.dimensions.find((d) => d.id === 'conflict')?.alignment ?? 0;
  if (alignment >= 80 && similarity >= 65) return 'mirror';
  if (counts.complementary >= 3 && counts.tension <= 2) return 'puzzle';
  if (alignment >= 70) return 'anchors';
  if (conflict >= 70 && counts.tension >= 3) return 'bridge';
  if (similarity < 40 && counts.tension <= 3) return 'explorers';
  if (counts.tension >= 5) return 'conversation';
  return 'balanced';
}

export function score(set: QuestionSet, a: Answers, b: Answers): ScoringResult {
  const qs = questionMap(set);
  const comparisons: QuestionComparison[] = set.questions.map((q) => {
    if (!a[q.id] || !b[q.id]) throw new Error(`Both participants must answer ${q.id}`);
    return compareQuestion(qs.get(q.id)!, a[q.id], b[q.id]);
  });

  const dimensions: DimensionScore[] = set.dimensions.map((dim) => {
    const items = comparisons.filter((c) => c.dimension === dim.id);
    const counts = emptyCounts();
    for (const c of items) counts[c.relation]++;
    return {
      id: dim.id,
      alignment: Math.round(weightedMean(items.map((c) => ({ v: c.alignment, w: c.weight })))),
      similarity: Math.round(100 * weightedMean(items.map((c) => ({ v: c.similarity, w: c.weight })))),
      counts,
      blindSpots: items.filter((c) => c.blindSpot).length,
    };
  });

  const counts = emptyCounts();
  for (const c of comparisons) counts[c.relation]++;
  const overall = {
    alignment: Math.round(dimensions.reduce((s, d) => s + d.alignment, 0) / dimensions.length),
    similarity: Math.round(100 * weightedMean(comparisons.map((c) => ({ v: c.similarity, w: c.weight })))),
    sameAnswers: counts.shared,
    total: comparisons.length,
    counts,
    blindSpots: comparisons.filter((c) => c.blindSpot).length,
  };

  const result: ScoringResult = {
    scoringVersion: SCORING_VERSION,
    questionSetVersion: set.version,
    overall,
    dimensions,
    comparisons,
    axes: { a: axisPositions(set, a), b: axisPositions(set, b) } as Record<Role, Record<AxisId, number | null>>,
    signature: 'balanced',
  };
  result.signature = pickSignature(result);
  return result;
}

export function dimensionScore(r: ScoringResult, id: DimensionId): DimensionScore {
  return r.dimensions.find((d) => d.id === id)!;
}
