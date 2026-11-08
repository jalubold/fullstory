import { classOf, thirtyAndThriving, twelveMonths } from './designs/celebrations';
import { littleThings, slowDays } from './designs/everyday';
import { firstYear, homeAndHeart, littleWonders, sundayAlbum } from './designs/family';
import { tenYears, twoOfUs, usLately } from './designs/love';
import { coastlines, terra, wanderlust } from './designs/travel';
import { evermore, noir, theVows } from './designs/wedding';
import type { TemplateDef } from './types';

/** All reusable template definitions. User projects copy from these and never modify them. */
export const TEMPLATES: TemplateDef[] = [
  evermore,
  theVows,
  wanderlust,
  homeAndHeart,
  littleWonders,
  usLately,
  terra,
  thirtyAndThriving,
  twelveMonths,
  slowDays,
  tenYears,
  noir,
  coastlines,
  sundayAlbum,
  firstYear,
  twoOfUs,
  classOf,
  littleThings,
];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): TemplateDef | undefined {
  return BY_ID.get(id);
}

export type { TemplateDef } from './types';
