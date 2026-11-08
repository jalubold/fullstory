import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/server/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/projects/', '/dashboard', '/orders/', '/checkout/', '/share/', '/restore/', '/admin', '/create/new'],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
