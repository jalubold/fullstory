import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Eye } from 'lucide-react';
import { BookCover, FlatPage, OpenBook } from '@/components/album/Book';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { buildSpreads } from '@/lib/album/geometry';
import { formatMoney, getCatalog, priceIn, sizesFor } from '@/lib/commerce/catalog';
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
  const catalog = getCatalog();
  const category = categoryById(t.category)!;
  const style = styleById(t.style)!;
  const sizes = sizesFor(t.orientation);
  const spreads = buildSpreads(doc.pages.length);
  const premium = priceIn(catalog.premiumTemplate.price, catalog.defaultCurrency);
  const related = TEMPLATES.filter((x) => x.id !== t.id && (x.category === t.category || x.style === t.style)).slice(0, 3);
  const usedIds = new Set(Object.keys(photos));
  const credits = [...new Map(SAMPLE_PHOTOS.filter((p) => usedIds.has(`s:${p.key}`)).map((p) => [p.photographer.username, p.photographer.name])).values()];

  return (
    <div className="pb-24">
      <div className="container-page pt-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/templates" className="hover:text-ink">Templates</Link>
          <span className="mx-2">/</span>
          <Link href={`/templates/category/${category.id}`} className="hover:text-ink">{category.label}</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{t.name}</span>
        </nav>
      </div>

      <section className="container-page mt-8 grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <div className="relative grid aspect-[1/0.86] place-items-center overflow-hidden rounded-[2rem] bg-paper-2">
            <BookCover
              page={doc.cover}
              size={doc.size}
              photos={photos}
              renderWidth={640}
              eager
              style={{ width: t.orientation === 'landscape' ? '74%' : t.orientation === 'portrait' ? '50%' : '62%' }}
            />
          </div>
          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
            {doc.pages.slice(0, 8).map((p, i) => (
              <Link key={p.id} href={`/templates/${t.id}/preview`} className="w-24 shrink-0 transition hover:-translate-y-0.5" aria-label={`Preview page ${i + 1}`}>
                <FlatPage page={p} size={doc.size} photos={photos} renderWidth={120} />
              </Link>
            ))}
          </div>
        </div>

        <div className="min-w-0 lg:pt-4">
          <div className="flex flex-wrap gap-2">
            <Link href={`/templates/category/${category.id}`} className="badge bg-white text-ink-soft ring-1 ring-line-strong">{category.label}</Link>
            <span className="badge bg-white text-ink-soft ring-1 ring-line-strong">{style.label}</span>
            <span className={`badge ${t.tier === 'premium' ? 'bg-ink text-paper' : 'bg-success-soft text-success'}`}>{t.tier === 'premium' ? 'Premium' : 'Free design'}</span>
          </div>
          <h1 className="mt-5 font-serif text-5xl font-medium leading-none md:text-6xl">{t.name}</h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{t.summary}</p>
          <p className="mt-4 leading-relaxed text-ink-soft/90">{t.description}</p>
          <ul className="mt-6 space-y-2">
            {t.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <Check size={16} className="mt-0.5 shrink-0 text-accent-dark" /> {h}
              </li>
            ))}
          </ul>

          <dl className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
            <Spec label="Orientation" value={t.orientation[0].toUpperCase() + t.orientation.slice(1)} />
            <Spec label="Available sizes" value={sizes.map((s) => `${s.label} (${s.metricLabel})`).join(' · ')} />
            <Spec label="Formats" value={['Digital PDF', 'Shareable album', ...catalog.covers.map((c) => c.label)].join(' · ')} />
            <Spec label="Designed pages" value={`${stats.pageCount} pages + cover`} />
            <Spec label="Page count" value={`Add or remove pages — ${catalog.pages.min} to ${catalog.pages.max} pages`} />
            <Spec label="Recommended photos" value={`${stats.photoSlots}–${stats.recommendedPhotos} photos`} />
            {t.tier === 'premium' && premium !== null && <Spec label="Premium design" value={`${formatMoney(premium, catalog.defaultCurrency)} one-time, added at checkout`} />}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/create/new?template=${t.id}`} className="btn btn-primary btn-lg">
              Customize This Template <ArrowRight size={16} />
            </Link>
            <Link href={`/templates/${t.id}/preview`} className="btn btn-secondary btn-lg">
              <Eye size={16} /> Preview full album
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">Free to customise. You only pay when you order a print, PDF or share link.</p>
        </div>
      </section>

      <section className="container-page mt-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Inside the album</p>
            <h2 className="mt-3 font-serif text-4xl font-medium">Every page, ready for your photos</h2>
            <p className="mt-3 max-w-xl text-ink-soft">
              The complete demo album with sample photography. When you start your own project, frames are empty and waiting for your
              pictures — and every text can be rewritten.
            </p>
          </div>
          <Link href={`/templates/${t.id}/preview`} className="btn btn-secondary">
            <Eye size={16} /> Open interactive preview
          </Link>
        </div>
        <div className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2">
          {spreads.map((s, i) => (
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
        <p className="mt-12 text-center text-xs text-muted">
          Sample photography by {credits.slice(0, 12).join(', ')}
          {credits.length > 12 ? ` and ${credits.length - 12} more` : ''} on Unsplash.
        </p>
      </section>

      {related.length > 0 && (
        <section className="container-page mt-24">
          <h2 className="font-serif text-3xl font-medium">You might also like</h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
