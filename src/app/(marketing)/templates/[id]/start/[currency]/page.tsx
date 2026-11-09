import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SalesPage } from '@/components/sales/SalesPage';
import { StudioClosed } from '@/components/sales/StudioClosed';
import { sizesFor } from '@/lib/commerce/catalog';
import { albumPrice, currencyFromSlug, currencySlugs } from '@/lib/commerce/sales';
import { appUrl, platformReady } from '@/lib/server/env';
import { TEMPLATES, getTemplate } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { categoryById } from '@/lib/templates/taxonomy';

export const metadata: Metadata = { title: 'Make it yours — everything included', robots: { index: false } };

/**
 * The sales page for a design, prerendered per currency so it opens instantly.
 * Visitors land on /templates/[id]/start; proxy.ts picks their currency.
 */
export const ensureStatic = 'navigation';
export const instant = false;

export function generateStaticParams() {
  return TEMPLATES.flatMap((t) => currencySlugs().map((currency) => ({ id: t.id, currency })));
}

export default async function TemplateStartPage({ params }: PageProps<'/templates/[id]/start/[currency]'>) {
  const { id, currency: slug } = await params;
  const template = getTemplate(id);
  const currency = currencyFromSlug(slug);
  if (!template || !currency) notFound();
  if (!platformReady) return <StudioClosed template={template} />;

  const demo = getTemplateDemo(template)!;
  const size = sizesFor(template.orientation)[0];
  return (
    <SalesPage
      demo={demo}
      name={template.name}
      price={albumPrice(currency)}
      siteUrl={appUrl()}
      target={{ templateId: template.id, sizeId: size.id, title: `My ${categoryById(template.category)?.label.toLowerCase()} album` }}
    />
  );
}
