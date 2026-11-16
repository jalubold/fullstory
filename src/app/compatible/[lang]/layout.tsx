import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { preload } from 'react-dom';
import { isLocale, LOCALES, LOCALE_NAMES } from '@/lib/compat/i18n';
import { UI } from '@/lib/compat/ui-strings';

/** One version per language; the proxy picks it from the visitor's choice or country. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/** All languages are known at build time (generateStaticParams); opt out of unknown-param validation. */
export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : 'en';
  const t = UI[locale].meta;
  const image = { url: `/og/awc-${locale}.png`, width: 1200, height: 630, alt: 'Are We Compatible?' };
  return {
    title: { default: t.title, template: '%s · Are We Compatible?' },
    description: t.description,
    icons: { icon: '/awc-icon.svg', apple: '/awc-apple-icon.png' },
    openGraph: { type: 'website', siteName: 'Are We Compatible?', title: 'Are We Compatible?', description: t.ogDescription, locale: LOCALE_NAMES[locale].intl.replace('-', '_'), images: [image] },
    twitter: { card: 'summary_large_image', title: 'Are We Compatible?', description: t.twitter, images: [image.url] },
  };
}

export const viewport: Viewport = { themeColor: '#FAF7F2' };

export default async function CompatLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  preload('/fonts/fraunces-400.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  preload('/fonts/manrope-400.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  return (
    <div lang={lang} className="awc flex min-h-dvh flex-col antialiased">
      {children}
    </div>
  );
}
