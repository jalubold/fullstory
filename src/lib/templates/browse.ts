import { getCatalog } from '@/lib/commerce/catalog';
import { allTemplateDemos, type TemplateDemo } from './demo';
import { CATEGORIES, categoryById, STYLES, styleById } from './taxonomy';

export function browseMeta(demo: TemplateDemo, rank: number) {
  const t = demo.template;
  const sizes = getCatalog().sizes.filter((s) => s.orientation === t.orientation).map((s) => s.id);
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    style: t.style,
    orientation: t.orientation,
    tier: t.tier,
    pageCount: demo.stats.pageCount,
    photoSlots: demo.stats.photoSlots,
    sizes,
    rank: (t.featured ? 0 : 100) + rank,
    text: [t.name, t.summary, t.description, categoryById(t.category)?.label, styleById(t.style)?.label, t.orientation].join(' ').toLowerCase(),
  };
}

export function browseOptions() {
  return {
    categories: CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
    styles: STYLES.map((s) => ({ id: s.id, label: s.label })),
    sizes: getCatalog().sizes.map((s) => ({ id: s.id, label: `${s.label} · ${s.orientation[0].toUpperCase()}${s.orientation.slice(1)}` })),
  };
}

export { allTemplateDemos };
