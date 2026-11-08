import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/server/env';
import { TEMPLATES } from '@/lib/templates';
import { CATEGORIES } from '@/lib/templates/taxonomy';

/** Public pages only — albums, orders and share links stay out of search engines. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' = 'monthly') => ({ url: `${base}${path}`, priority, changeFrequency });
  return [
    page('/', 1, 'weekly'),
    page('/templates', 0.9, 'weekly'),
    page('/templates/categories', 0.7),
    ...CATEGORIES.map((c) => page(`/templates/category/${c.id}`, 0.7)),
    ...TEMPLATES.map((t) => page(`/templates/${t.id}`, 0.8)),
    ...TEMPLATES.map((t) => page(`/templates/${t.id}/preview`, 0.6)),
    page('/explore', 0.6),
    page('/how-it-works', 0.6),
    page('/faq', 0.5),
    page('/about', 0.5),
    page('/create', 0.7),
  ];
}
