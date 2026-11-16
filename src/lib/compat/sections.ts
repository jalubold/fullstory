import type { Locale } from './i18n';
import type { Blueprint } from './report';
import { UI } from './ui-strings';

/** The fourteen Blueprint sections, in order (shared by the web report and the PDF). */
export const SECTION_IDS = ['overview', 'profile-a', 'profile-b', 'breakdown', 'together', 'differ', 'emotional', 'communication', 'conflict', 'future', 'strengths', 'blind-spots', 'starters', 'actions'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** Section titles in the reader's language (deep-dive titles come localized from the Blueprint). */
export function sectionTitles(bp: Blueprint, locale: Locale): Record<SectionId, string> {
  const t = UI[locale].blueprint;
  return {
    overview: t.sections.overview,
    'profile-a': t.profileTitle(bp.names.a),
    'profile-b': t.profileTitle(bp.names.b),
    breakdown: t.sections.breakdown,
    together: t.sections.together,
    differ: t.sections.differ,
    emotional: bp.emotional.title,
    communication: bp.communication.title,
    conflict: bp.conflict.title,
    future: bp.future.title,
    strengths: t.sections.strengths,
    'blind-spots': t.sections.blindSpots,
    starters: t.sections.starters,
    actions: t.sections.actions,
  };
}

