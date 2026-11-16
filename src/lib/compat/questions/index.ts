import type { Locale } from '../i18n';
import type { Question, QuestionSet, QuestionSetTranslation } from '../types';
import { QUESTION_SET_V1 } from './v1';
import { QUESTION_SET_V1_ID } from './v1.id';

/**
 * Registry of question sets. New assessments use CURRENT_QUESTION_SET; stored
 * assessments keep the version they were started with, so editing questions
 * never changes an existing result. To expand: add v2.ts and register it here.
 */
const SETS: Record<string, QuestionSet> = {
  [QUESTION_SET_V1.version]: QUESTION_SET_V1,
};

/** Translations per set. English is the authored base; other languages translate its text only. */
const TRANSLATIONS: Record<string, Partial<Record<Locale, QuestionSetTranslation>>> = {
  [QUESTION_SET_V1.version]: { id: QUESTION_SET_V1_ID },
};

export const CURRENT_QUESTION_SET = QUESTION_SET_V1.version;

const localized = new Map<string, QuestionSet>();

/**
 * A question set in a language. Ids, order, weights and pairs are identical in
 * every language, so scoring never depends on the language. Missing
 * translations fall back to English, string by string.
 */
export function getQuestionSet(version: string = CURRENT_QUESTION_SET, locale: Locale = 'en'): QuestionSet {
  const base = SETS[version];
  if (!base) throw new Error(`Unknown question set: ${version}`);
  const tr = locale === 'en' ? undefined : TRANSLATIONS[version]?.[locale];
  if (!tr) return base;
  const key = `${version}:${locale}`;
  const hit = localized.get(key);
  if (hit) return hit;
  const set = translateSet(base, tr);
  localized.set(key, set);
  return set;
}

export function translateSet(base: QuestionSet, tr: QuestionSetTranslation): QuestionSet {
  return {
    version: base.version,
    dimensions: base.dimensions.map((d) => ({ ...d, ...tr.dimensions[d.id] })),
    questions: base.questions.map((q) => {
      const t = tr.questions[q.id];
      if (!t) return q;
      const pair = (p: { a: string; b: string; note: string }) => ({ ...p, note: t.pairs?.[`${p.a}|${p.b}`] ?? p.note });
      return {
        ...q,
        prompt: t.prompt ?? q.prompt,
        topic: t.topic ?? q.topic,
        options: q.options.map((o) => ({ ...o, ...t.options?.[o.id] })),
        complements: q.complements?.map(pair),
        frictions: q.frictions?.map(pair),
        blindSpots: q.blindSpots?.map((b, i) => ({ ...b, note: t.blindSpots?.[i] ?? b.note })),
        insight: { ...q.insight, ...t.insight },
        starter: t.starter ?? q.starter,
      };
    }),
  };
}

export function questionMap(set: QuestionSet): Map<string, Question> {
  return new Map(set.questions.map((q) => [q.id, q]));
}

/** Validates a full answer sheet against a question set: every question answered with a known option. */
export function validateAnswers(set: QuestionSet, answers: Record<string, unknown>): { ok: true } | { ok: false; missing: string[]; invalid: string[] } {
  const missing: string[] = [];
  const invalid: string[] = [];
  for (const q of set.questions) {
    const v = answers[q.id];
    if (v === undefined || v === null || v === '') missing.push(q.id);
    else if (typeof v !== 'string' || !q.options.some((o) => o.id === v)) invalid.push(q.id);
  }
  const unknown = Object.keys(answers).filter((k) => !set.questions.some((q) => q.id === k));
  invalid.push(...unknown);
  return missing.length || invalid.length ? { ok: false, missing, invalid } : { ok: true };
}

/** Keeps only known questions with known options (for saving partial progress). */
export function sanitizeAnswers(set: QuestionSet, answers: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of set.questions) {
    const v = answers[q.id];
    if (typeof v === 'string' && q.options.some((o) => o.id === v)) out[q.id] = v;
  }
  return out;
}
