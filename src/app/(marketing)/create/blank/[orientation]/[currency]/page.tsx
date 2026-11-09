import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SalesPage } from '@/components/sales/SalesPage';
import { StudioClosed } from '@/components/sales/StudioClosed';
import type { Orientation } from '@/lib/album/types';
import { getCatalog, sizesFor } from '@/lib/commerce/catalog';
import { albumPrice, currencyFromSlug, currencySlugs } from '@/lib/commerce/sales';
import { appUrl, platformReady } from '@/lib/server/env';
import { getTemplateDemo } from '@/lib/templates/demo';

export const metadata: Metadata = { title: 'Make it yours — everything included', robots: { index: false } };

const ORIENTATIONS: readonly Orientation[] = ['square', 'landscape', 'portrait'];

/**
 * The sales page for a blank book, prerendered per orientation and currency.
 * Visitors land on /create/blank/[orientation]; proxy.ts picks their currency.
 */
export const ensureStatic = 'navigation';
export const instant = false;

export function generateStaticParams() {
  return ORIENTATIONS.flatMap((orientation) => currencySlugs().map((currency) => ({ orientation, currency })));
}

export default async function BlankStartPage({ params }: PageProps<'/create/blank/[orientation]/[currency]'>) {
  const { orientation, currency: slug } = await params;
  const currency = currencyFromSlug(slug);
  if (!ORIENTATIONS.includes(orientation as Orientation) || !currency) notFound();
  if (!platformReady) return <StudioClosed />;

  // Sold with the same promise as a design, shown with a sample one.
  const catalog = getCatalog();
  const size = sizesFor(orientation as Orientation)[0] ?? catalog.sizes[0];
  return (
    <SalesPage
      demo={getTemplateDemo('slow-days')!}
      name="A blank book"
      price={albumPrice(currency)}
      siteUrl={appUrl()}
      target={{ templateId: null, sizeId: size.id, title: 'My photo album', pageCount: catalog.pages.default }}
    />
  );
}
