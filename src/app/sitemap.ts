import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/server/env';

/** Public pages only — private links, albums, orders and share links stay out of search engines. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' = 'monthly') => ({ url: `${base}${path}`, priority, changeFrequency });
  return [page('/', 1, 'weekly'), page('/compatible/start', 0.8), page('/compatible/how-it-works', 0.7)];
}
