import type { Locale } from './i18n';
import { getQuestionSet } from './questions';
import { relationLabels } from './report';
import { REPORT_STRINGS } from './report-strings';
import { compareQuestion } from './scoring';
import type { Relation } from './types';
import { UI } from './ui-strings';

/**
 * "Try one question" on the landing page: the visitor answers a real question,
 * guesses what the other person would say, and sees how the real engine reads
 * that pair. Nothing here is written for the demo — every outcome comes from
 * compareQuestion() and the question's authored notes, so the taste matches
 * the test.
 */

/** The question used for the taste. Rich in authored pairs, and light enough for a first tap. */
export const TRY_QUESTION_ID = 'com-raise';

export interface TryOutcome {
  relation: Relation;
  /** Chip label: the relation, or "Shared blind spot". */
  label: string;
  blindSpot: boolean;
  note: string;
  /** How far the two circles overlap in the illustration (0–100). */
  overlap: number;
}

export interface TryQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  /** Keyed "yours|theirs". */
  outcomes: Record<string, TryOutcome>;
}

const OVERLAP: Record<Relation, number> = { shared: 86, close: 64, complementary: 56, different: 30, tension: 6 };

export function tryQuestion(locale: Locale, questionId: string = TRY_QUESTION_ID): TryQuestion {
  const q = getQuestionSet(undefined, locale).questions.find((x) => x.id === questionId);
  if (!q) throw new Error(`Unknown question: ${questionId}`);
  const labels = relationLabels(locale);
  const outcomes: Record<string, TryOutcome> = {};
  for (const a of q.options) {
    for (const b of q.options) {
      const c = compareQuestion(q, a.id, b.id);
      const note = c.relation === 'shared' ? (c.blindSpot ?? q.insight.shared) : c.relation === 'close' ? REPORT_STRINGS[locale].closeNote : (c.pairNote ?? c.blindSpot ?? q.insight.different);
      outcomes[`${a.id}|${b.id}`] = {
        relation: c.relation,
        label: c.blindSpot ? UI[locale].blueprint.sharedBlindSpot : labels[c.relation],
        blindSpot: !!c.blindSpot,
        note,
        overlap: OVERLAP[c.relation],
      };
    }
  }
  return { id: q.id, prompt: q.prompt, options: q.options.map((o) => ({ id: o.id, label: o.label })), outcomes };
}
