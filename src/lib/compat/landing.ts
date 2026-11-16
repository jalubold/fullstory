import type { Locale } from './i18n';
import { getQuestionSet } from './questions';
import { relationLabels } from './report';
import { REPORT_STRINGS } from './report-strings';
import { ALIGNMENT, compareQuestion } from './scoring';
import type { DimensionId, Question } from './types';
import { UI } from './ui-strings';

/**
 * Real examples for the landing page. Each one is a real question with two
 * real answers, read by the same engine that scores every couple — nothing
 * here is written for the page.
 */

export interface PairReading {
  label: string;
  score: number;
  note: string;
  tone: 'good' | 'warn' | 'neutral';
}

export interface PairExample {
  prompt: string;
  options: Array<{ id: string; label: string }>;
  a: string;
  b: string;
  reading: PairReading;
}

/** One telling pair per dimension, chosen so the five show five different readings. */
export const DIMENSION_PAIRS: Record<DimensionId, [string, string, string]> = {
  communication: ['com-raise', 'now', 'calm'],
  emotional: ['emo-loved', 'words', 'help'],
  lifestyle: ['life-weekend', 'social', 'home'],
  future: ['fut-pace', 'steady', 'slow'],
  conflict: ['con-heat', 'quiet', 'quiet'],
};

/** "Same isn't always better": the same answer that scores 70, and two different answers that score 80. */
export const SCORE_PAIRS = { same: ['emo-open', 'rarely', 'rarely'], different: ['con-heat', 'push', 'pause'] } as const;

export function readPair(q: Question, a: string, b: string, locale: Locale): PairReading {
  const c = compareQuestion(q, a, b);
  const label = c.blindSpot ? UI[locale].blueprint.sharedBlindSpot : relationLabels(locale)[c.relation];
  const note = c.relation === 'shared' ? (c.blindSpot ?? q.insight.shared) : c.relation === 'close' ? REPORT_STRINGS[locale].closeNote : (c.pairNote ?? c.blindSpot ?? q.insight.different);
  const tone = c.blindSpot || c.relation === 'tension' ? 'warn' : c.relation === 'different' ? 'neutral' : 'good';
  return { label, score: c.alignment, note, tone };
}

function example(locale: Locale, [qid, a, b]: readonly [string, string, string]): PairExample {
  const q = getQuestionSet(undefined, locale).questions.find((x) => x.id === qid);
  if (!q) throw new Error(`Unknown question: ${qid}`);
  return { prompt: q.prompt, options: q.options.map((o) => ({ id: o.id, label: o.label })), a, b, reading: readPair(q, a, b, locale) };
}

export function dimensionSheets(locale: Locale) {
  const set = getQuestionSet(undefined, locale);
  return set.dimensions.map((d) => {
    const qs = set.questions.filter((q) => q.dimension === d.id);
    const pair = DIMENSION_PAIRS[d.id];
    return { id: d.id, label: d.label, short: d.short, count: qs.length, ...example(locale, pair), also: qs.filter((q) => q.id !== pair[0]).map((q) => q.topic) };
  });
}

export function scoreExamples(locale: Locale) {
  return { same: example(locale, SCORE_PAIRS.same), different: example(locale, SCORE_PAIRS.different) };
}

/** The alignment each kind of pair earns, in the order of the landing page's relation list. */
export const RELATION_SCALE = [ALIGNMENT.shared, ALIGNMENT.complementary, ALIGNMENT.different, ALIGNMENT.tension, ALIGNMENT.sharedBlindSpot];

/** The first sentence of a note, for tight spaces. */
export const firstSentence = (s: string) => s.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s;
