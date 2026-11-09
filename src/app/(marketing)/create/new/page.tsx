import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { BookCover } from '@/components/album/Book';
import { headers } from 'next/headers';
import { SalesPage } from '@/components/sales/SalesPage';
import type { Orientation } from '@/lib/album/types';
import { formatMoney, getCatalog, priceIn, sizesFor } from '@/lib/commerce/catalog';
import { countryFromHeaders } from '@/lib/commerce/region';
import { appUrl, platformReady } from '@/lib/server/env';
import { checkoutCurrency } from '@/lib/server/orders';
import { getTemplate } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { categoryById } from '@/lib/templates/taxonomy';

export const metadata: Metadata = { title: 'Make it yours — everything included', robots: { index: false } };

async function Start({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Starting an album is always per visit (and the blank-album preview builds pages with fresh ids).
  await connection();
  const sp = await searchParams;
  const template = typeof sp.template === 'string' ? getTemplate(sp.template) : undefined;
  const orientation = (['square', 'landscape', 'portrait'] as const).includes(sp.orientation as Orientation) ? (sp.orientation as Orientation) : 'square';

  if (!platformReady) {
    const demo = template ? getTemplateDemo(template) : null;
    return (
      <section className="cloth relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden">
        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <p className="smallcaps !text-white/60">The studio</p>
            <h1 className="rise mt-5 font-serif text-5xl font-medium leading-[0.95] sm:text-7xl">
              Opening <span className="italic">very soon.</span>
            </h1>
            <p className="rise mt-6 text-lg text-white/75" style={{ animationDelay: '120ms' }}>
              Saving albums isn’t switched on for this site yet. Every design is ready to explore — flip through the demos and choose your favourite.
            </p>
            <div className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ animationDelay: '220ms' }}>
              {template ? (
                <Link href={`/templates/${template.id}/preview`} className="btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]">
                  Flip through {template.name}
                </Link>
              ) : null}
              <Link href="/templates" className={template ? 'text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white' : 'btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]'}>
                {template ? <span className="link-underline">Browse the collection</span> : 'Browse the collection'}
              </Link>
            </div>
            <p className="mt-14 max-w-md border-t border-white/15 pt-5 text-xs leading-relaxed text-white/45">
              For the site owner: albums and photos need a place to be saved. Connect Supabase in Vercel → Storage, then redeploy. Visitors never need an account.
            </p>
          </div>
          {demo ? (
            <div className="book-in hidden w-[320px] shadow-[0_40px_60px_-30px_rgb(0_0_0/.6)] lg:block">
              <BookCover page={demo.doc.cover} size={demo.doc.size} photos={demo.photos} renderWidth={320} eager />
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  // The sales page: what the album includes, with real pages from the chosen design, and one way to buy.
  const catalog = getCatalog();
  const currency = checkoutCurrency(countryFromHeaders(await headers()));
  const amount = priceIn(catalog.album.price, currency);
  const price = amount === null ? '' : formatMoney(amount, currency);
  if (template) {
    const demo = getTemplateDemo(template)!;
    const size = sizesFor(template.orientation)[0];
    return (
      <SalesPage
        demo={demo}
        name={template.name}
        price={price}
        siteUrl={appUrl()}
        target={{ templateId: template.id, sizeId: size.id, title: `My ${categoryById(template.category)?.label.toLowerCase()} album` }}
      />
    );
  }

  // A blank book: sold with the same promise, shown with a sample design.
  const size = sizesFor(orientation)[0] ?? catalog.sizes[0];
  return (
    <SalesPage
      demo={getTemplateDemo('slow-days')!}
      name="A blank book"
      price={price}
      siteUrl={appUrl()}
      target={{ templateId: null, sizeId: size.id, title: 'My photo album', pageCount: catalog.pages.default }}
    />
  );
}

export default function NewAlbumPage({ searchParams }: PageProps<'/create/new'>) {
  return (
    <Suspense fallback={<div className="cloth min-h-[calc(100svh-4.5rem)]" />}>
      <Start searchParams={searchParams} />
    </Suspense>
  );
}
