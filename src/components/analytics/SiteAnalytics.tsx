'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

/** Private links carry secret tokens and ids; report them as a pattern, never the real address. */
const PRIVATE: Array<[RegExp, string]> = [
  [/^\/share\/[^/]+/, '/share/[token]'],
  [/^\/restore\/[^/]+/, '/restore/[token]'],
  [/^\/projects\/[^/]+/, '/projects/[id]'],
  [/^\/orders\/[^/]+/, '/orders/[id]'],
];

function redact(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url);
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/dev-sheet')) return null;
  for (const [re, label] of PRIVATE) url.pathname = url.pathname.replace(re, label);
  url.search = '';
  url.hash = '';
  return { ...event, url: url.toString() };
}

/** Vercel Web Analytics: anonymous page views, without private links or query strings. */
export function SiteAnalytics() {
  return <Analytics beforeSend={redact} />;
}
