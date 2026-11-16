import { getQuestionSet } from './questions';
import { scoreWith, scoringParams, SCORING_VERSION, type ScoringParams } from './scoring';
import type { Answers, DimensionId, QuestionSet } from './types';

/**
 * Robustness check (a sensitivity analysis) for the scoring weights.
 *
 * The weights in scoring 2.0.0 follow published research, but their exact
 * sizes are a judgement. A sound method shouldn't hinge on that judgement, so
 * this check asks: if every weight were quite different, would couples get a
 * different answer?
 *
 * It scores a set of simulated couples (random answers, fixed seed), then
 * re-scores each of them under many random variations of the weights — every
 * question weight and every dimension weight moved independently by up to
 * ±`spread` — and measures how far the overall alignment moves.
 *
 * What it shows: how much the result depends on our choice of weights.
 * What it doesn't: whether the scores predict how real relationships go.
 * That needs outcome data from real couples.
 */

export interface Robustness {
  /** Simulated couples scored. */
  couples: number;
  /** Random weight variations tried per couple. */
  variations: number;
  /** How far each weight was moved, as a fraction (0.25 = up to ±25%). */
  spread: number;
  /** Mean absolute change in overall alignment, in points out of 100. */
  meanShift: number;
  /** 95% of results moved by no more than this many points. */
  p95Shift: number;
  /** The largest change seen. */
  maxShift: number;
  /** Share of results that kept the same relationship signature (0–100). */
  sameSignature: number;
}

/** Small, fast, seeded random number generator (mulberry32) — so the check is repeatable. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const randomAnswers = (set: QuestionSet, rand: () => number): Answers => Object.fromEntries(set.questions.map((q) => [q.id, q.options[Math.floor(rand() * q.options.length)].id]));

/** Every weight moved independently by up to ±spread. */
function vary(set: QuestionSet, base: ScoringParams, spread: number, rand: () => number): ScoringParams {
  const f = () => 1 + (rand() * 2 - 1) * spread;
  return {
    ...base,
    weights: Object.fromEntries(set.questions.map((q) => [q.id, (base.weights?.[q.id] ?? q.weight ?? 1) * f()])),
    dimensions: Object.fromEntries(set.dimensions.map((d) => [d.id, (base.dimensions?.[d.id] ?? 1) * f()])) as Record<DimensionId, number>,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function measureRobustness({ couples = 1000, variations = 100, spread = 0.25, seed = 20260101, version = SCORING_VERSION } = {}): Robustness {
  const set = getQuestionSet();
  const base = scoringParams(version);
  const rand = rng(seed);
  const variants = Array.from({ length: variations }, () => vary(set, base, spread, rand));
  const shifts: number[] = [];
  let same = 0;
  for (let i = 0; i < couples; i++) {
    const a = randomAnswers(set, rand);
    const b = randomAnswers(set, rand);
    const ref = scoreWith(set, a, b, base);
    for (const v of variants) {
      const r = scoreWith(set, a, b, v);
      shifts.push(Math.abs(r.overall.alignment - ref.overall.alignment));
      if (r.signature === ref.signature) same++;
    }
  }
  shifts.sort((x, y) => x - y);
  return {
    couples,
    variations,
    spread,
    meanShift: round1(shifts.reduce((s, x) => s + x, 0) / shifts.length),
    p95Shift: shifts[Math.floor(shifts.length * 0.95)],
    maxShift: shifts[shifts.length - 1],
    sameSignature: Math.round((100 * same) / shifts.length),
  };
}

let cached: Robustness | null = null;

/** The check's results for the current scoring version (computed once; the pages that show it are prerendered). */
export function robustness(): Robustness {
  return (cached ??= measureRobustness());
}
