import { classOf, thirtyAndThriving, twelveMonths } from './designs/celebrations';
import { littleThings, slowDays } from './designs/everyday';
import { firstYear, homeAndHeart, littleWonders, sundayAlbum } from './designs/family';
import { tenYears, twoOfUs, usLately } from './designs/love';
import { coastlines, terra, wanderlust } from './designs/travel';
import { evermore, noir, theVows } from './designs/wedding';
import curated from './curated.json';
import type { TemplateDef, TemplatePage } from './types';

interface CuratedPage {
  photos?: string[];
  texts?: string[];
}
interface CuratedTemplate {
  cover?: CuratedPage;
  back?: CuratedPage;
  pages?: CuratedPage[];
}

/**
 * Hand-picked demo photography and story captions for each template
 * (src/lib/templates/curated.json). Layouts and styling stay in the design files.
 */
function curate(t: TemplateDef): TemplateDef {
  const c = (curated as Record<string, CuratedTemplate>)[t.id];
  if (!c) return t;
  const apply = (page: TemplatePage, cp?: CuratedPage): TemplatePage => ({
    ...page,
    ...(cp?.photos?.length ? { photos: cp.photos } : {}),
    ...(cp?.texts?.length ? { texts: cp.texts } : {}),
  });
  return {
    ...t,
    cover: apply(t.cover, c.cover),
    back: apply(t.back, c.back),
    pages: t.pages.map((p, i) => apply(p, c.pages?.[i])),
  };
}

/** All reusable template definitions. User projects copy from these and never modify them. */
export const TEMPLATES: TemplateDef[] = (
  [
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
  ] as TemplateDef[]
).map(curate);

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): TemplateDef | undefined {
  return BY_ID.get(id);
}

export type { TemplateDef } from './types';
