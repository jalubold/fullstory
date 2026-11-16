import type { Locale } from './i18n';
import { getQuestionSet } from './questions';
import { buildBlueprint, type Blueprint } from './report';
import type { Answers } from './types';

/**
 * A fictional sample couple, used on the landing page to show what real
 * output looks like. Everything shown is produced by the same engine as
 * every paying couple's Blueprint — nothing is hand-written for the page.
 */
export const SAMPLE_ANSWERS: { a: Answers; b: Answers } = {
  a: {
    'com-rhythm': 'steady', 'com-raise': 'now', 'com-upset': 'comfort', 'com-closest': 'deep',
    'emo-loved': 'words', 'emo-show': 'touch', 'emo-reassure': 'lots', 'emo-open': 'easily',
    'life-recharge': 'together', 'life-weekend': 'adventure', 'life-social': 'mostly', 'life-plans': 'fine',
    'fut-pace': 'steady', 'fut-money': 'mostly', 'fut-children': 'yes', 'fut-family': 'close',
    'con-heat': 'push', 'con-repair': 'talk', 'con-sorry': 'easy', 'con-matters': 'understood',
  },
  b: {
    'com-rhythm': 'one', 'com-raise': 'calm', 'com-upset': 'space', 'com-closest': 'playful',
    'emo-loved': 'help', 'emo-show': 'words', 'emo-reassure': 'little', 'emo-open': 'slowly',
    'life-recharge': 'alone', 'life-weekend': 'home', 'life-social': 'mostly', 'life-plans': 'prefer',
    'fut-pace': 'steady', 'fut-money': 'split', 'fut-children': 'likely', 'fut-family': 'close',
    'con-heat': 'pause', 'con-repair': 'gesture', 'con-sorry': 'time', 'con-matters': 'fair',
  },
};

export const SAMPLE_NAMES: Record<Locale, { a: string; b: string }> = {
  en: { a: 'Maya', b: 'Daniel' },
  id: { a: 'Ayu', b: 'Bima' },
};

const cache = new Map<Locale, Blueprint>();

export function sampleBlueprint(locale: Locale): Blueprint {
  const hit = cache.get(locale);
  if (hit) return hit;
  const bp = buildBlueprint({ set: getQuestionSet(undefined, locale), context: 'dating', names: SAMPLE_NAMES[locale], answers: SAMPLE_ANSWERS, locale });
  cache.set(locale, bp);
  return bp;
}
