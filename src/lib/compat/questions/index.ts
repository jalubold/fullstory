import type { Question, QuestionSet } from '../types';
import { QUESTION_SET_V1 } from './v1';

/**
 * Registry of question sets. New assessments use CURRENT_QUESTION_SET; stored
 * assessments keep the version they were started with, so editing questions
 * never changes an existing result. To expand: add v2.ts and register it here.
 */
const SETS: Record<string, QuestionSet> = {
  [QUESTION_SET_V1.version]: QUESTION_SET_V1,
};

export const CURRENT_QUESTION_SET = QUESTION_SET_V1.version;

export function getQuestionSet(version: string = CURRENT_QUESTION_SET): QuestionSet {
  const set = SETS[version];
  if (!set) throw new Error(`Unknown question set: ${version}`);
  return set;
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
