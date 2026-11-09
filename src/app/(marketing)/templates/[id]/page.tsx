import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, ChevronLeft, Eye } from 'lucide-react';
import { BookCover, OpenBook } from '@/components/album/Book';
import { AlbumPrice } from '@/components/commerce/AlbumPrice';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { INCLUDED } from '@/lib/commerce/included';
import { buildSpreads } from '@/lib/album/geometry';
import { sizesFor } from '@/lib/commerce/catalog';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { SAMPLE_PHOTOS } from '@/lib/templates/samples';
import { categoryById, styleById } from '@/lib/templates/taxonomy';

/** All params are known at build time (generateStaticParams); opt out of unknown-param validation. */
export const instant = false;

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<'/templates/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const demo = getTemplateDemo(id);
  if (!demo) return {};
  return { title: `${demo.template.name} — ${categoryById(demo.template.category)?.label} photo album template`, description: demo.template.description };
}

export default async function TemplateDetailPage({ params }: PageProps<'/templates/[id]'>) {
  const { id } = await params;
  const demo = getTemplateDemo(id);
  if (!demo) notFound();
  const { template: t, doc, photos, stats } = demo;
  const category = categoryById(t.category)!;
  const style = styleById(t.style)!;
  const sizes = sizesFor(t.orientation);
  const spreads = buildSpreads(doc.pages.length);
  const related = TEMPLATES.filter((x) => x.id !== t.id && (x.category === t.category || x.style === t.style)).slice(0, 3);
  const usedIds = new Set(Object.keys(photos));
  const credits = [...new Map(SAMPLE_PHOTOS.filter((p) => usedIds.has(`s:${p.key}`)).map((p) => [p.photographer.username, p.photographer.name])).values()];

  return (
    <div className="pb-32 lg:pb-24">
      <div className="container-page pt-3 lg:pt-8">
        <Link href="/templates" className="-ml-1 inline-flex h-10 items-center gap-1 text-[15px] text-ink-soft active:text-ink lg:hidden">
          <ChevronLeft size={20} /> All designs
        </Link>
        <nav aria-label="Breadcrumb" className="hidden text-sm text-muted lg:block">
          <Link href="/templates" className="hover:text-ink">Templates</Link>
          <span className="mx-2">/</span>
          <Link href={`/templates/category/${category.id}`} className="hover:text-ink">{category.label}</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{t.name}</span>
        </nav>
      </div>

      <section className="container-page mt-2 grid gap-8 lg:mt-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <div className="relative grid aspect-[1/0.86] place-items-center overflow-hidden rounded-[4px] bg-paper-2">
            <BookCover
              page={doc.cover}
              size={doc.size}
              photos={photos}
              renderWidth={640}
              eager
              style={{ width: t.orientation === 'landscape' ? '74%' : t.orientation === 'portrait' ? '50%' : '62%' }}
            />
          </div>
        </div>

        <div className="min-w-0 lg:pt-4">
          <p className="smallcaps">
            {category.label} · {style.label}
          </p>
          <h1 className="mt-3 font-serif text-[2.75rem] font-medium leading-none md:text-6xl">{t.name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t.summary}</p>
          <ul className="mt-6 space-y-2">
            {t.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <Check size={16} className="mt-0.5 shrink-0 text-accent-dark" /> {h}
              </li>
            ))}
          </ul>

          <dl className="mt-8 divide-y divide-line rounded-[4px] border border-line bg-white text-sm">
            <Spec label="Size" value={sizes.map((s) => s.label).join(' · ')} />
            <Spec label="Pages" value={`${stats.pageCount} pages + cover`} />
            <Spec label="Photos" value={`${stats.photoSlots}–${stats.recommendedPhotos}`} />
          </dl>

          <div className="mt-8 rounded-[6px] border border-line bg-white p-5 sm:p-6">
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-3xl text-ink"><AlbumPrice /></span>
              <span className="text-sm text-ink-soft">one-time · everything included</span>
            </p>
            <ul className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2">
              {INCLUDED.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-sm text-ink-soft">
                  <Check size={15} className="mt-0.5 shrink-0 text-accent-dark" /> {f.title}
                </li>
              ))}
            </ul>
            <div className="mt-6 hidden flex-wrap gap-3 lg:flex">
              <Link href={`/create/new?template=${t.id}`} className="btn btn-primary btn-lg">
                Use this design — <AlbumPrice /> <ArrowRight size={16} />
              </Link>
              <Link href={`/templates/${t.id}/preview`} className="btn btn-secondary btn-lg">
                <Eye size={16} /> Preview full album
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Phones & tablets: an app-style action bar — the next step is always one thumb-tap away. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/92 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4">
          <Link href={`/templates/${t.id}/preview`} className="btn btn-secondary h-12 shrink-0 gap-2 px-4 text-[0.8125rem]" aria-label="Flip through the full album">
            <Eye size={17} /> Preview
          </Link>
          <Link href={`/create/new?template=${t.id}`} className="btn btn-primary h-12 flex-1 text-[0.75rem] uppercase tracking-[0.14em]">
            Use this design · <AlbumPrice /> <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <section className="container-page mt-16 lg:mt-24">
        <p className="smallcaps">Inside the album</p>
        <h2 className="mt-3 font-serif text-[2rem] font-medium leading-tight md:text-4xl">Every page, ready for your photos</h2>
        <div className="mt-8 grid gap-x-10 gap-y-10 md:mt-12 md:grid-cols-2 md:gap-y-14">
          {spreads.slice(0, 4).map((s, i) => (
            <figure key={i}>
              <OpenBook
                left={s.left !== null ? doc.pages[s.left] : null}
                right={s.right !== null ? doc.pages[s.right] : null}
                size={doc.size}
                photos={photos}
                renderWidth={640}
              />
              <figcaption className="mt-4 text-center text-xs uppercase tracking-[0.16em] text-muted">
                {s.left === null ? `Page ${s.right! + 1}` : s.right === null ? `Page ${s.left + 1}` : `Pages ${s.left + 1}–${s.right + 1}`}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10 flex justify-center md:mt-14">
          <Link href={`/templates/${t.id}/preview`} className="btn btn-secondary btn-lg w-full sm:w-auto">
            <Eye size={16} /> Flip through all {stats.pageCount} pages
          </Link>
        </div>
        <p className="mt-10 hidden text-center text-xs text-muted sm:block">
          Sample photography by {credits.slice(0, 12).join(', ')}
          {credits.length > 12 ? ` and ${credits.length - 12} more` : ''} on Unsplash.
        </p>
      </section>

      {related.length > 0 && (
        <section className="container-page mt-16 lg:mt-24">
          <h2 className="font-serif text-[1.75rem] font-medium md:text-3xl">You might also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:mt-8 lg:grid-cols-3">
            {related.map((r) => (
              <TemplateCard key={r.id} demo={getTemplateDemo(r)!} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 px-5 py-3.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
