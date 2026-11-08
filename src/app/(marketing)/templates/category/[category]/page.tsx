import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookCover } from '@/components/album/Book';
import { TemplateBrowser } from '@/components/templates/TemplateBrowser';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TEMPLATES } from '@/lib/templates';
import { browseMeta, browseOptions } from '@/lib/templates/browse';
import { getTemplateDemo } from '@/lib/templates/demo';
import { CATEGORIES, categoryById } from '@/lib/templates/taxonomy';

/** All params are known at build time (generateStaticParams); opt out of unknown-param validation. */
export const instant = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: PageProps<'/templates/category/[category]'>): Promise<Metadata> {
  const { category } = await params;
  const c = categoryById(category);
  return c ? { title: `${c.label} photo album templates`, description: c.description } : {};
}

export default async function CategoryPage({ params }: PageProps<'/templates/category/[category]'>) {
  const { category } = await params;
  const c = categoryById(category);
  if (!c) notFound();
  const demos = TEMPLATES.filter((t) => t.category === c.id).map((t) => getTemplateDemo(t)!);
  const items = demos.map((d, i) => ({ ...browseMeta(d, i), node: <TemplateCard demo={d} eager={i < 3} /> }));

  return (
    <div className="pb-24">
      <section className="border-b border-line bg-paper-2/70">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <Link href="/templates" className="hover:text-ink">Templates</Link>
              <span className="mx-2">/</span>
              <Link href="/templates/categories" className="hover:text-ink">Categories</Link>
            </nav>
            <h1 className="mt-6 font-serif text-5xl font-medium md:text-7xl">{c.label}</h1>
            <p className="mt-4 font-serif text-2xl italic text-accent-dark">{c.tagline}</p>
            <p className="mt-4 max-w-lg text-ink-soft">{c.description}</p>
          </div>
          <div className="relative h-64 md:h-80">
            {demos.slice(0, 3).map((d, i) => (
              <BookCover
                key={d.template.id}
                page={d.doc.cover}
                size={d.doc.size}
                photos={d.photos}
                renderWidth={280}
                eager
                className="absolute"
                style={{
                  width: d.template.orientation === 'landscape' ? '58%' : d.template.orientation === 'portrait' ? '36%' : '46%',
                  left: `${8 + i * 20}%`,
                  top: `${50 + (i - 1) * 6}%`,
                  transform: `translateY(-50%) rotate(${(i - 1) * 6}deg)`,
                  zIndex: 3 - i,
                }}
              />
            ))}
          </div>
        </div>
      </section>
      <div className="container-page mt-12">
        {demos.length ? (
          <TemplateBrowser items={items} {...browseOptions()} lockedCategory={c.id} />
        ) : (
          <p className="text-muted">New designs for this category are coming soon.</p>
        )}
        <div className="mt-20 border-t border-line pt-10">
          <p className="eyebrow">More categories</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((x) => x.id !== c.id).map((x) => (
              <Link key={x.id} href={`/templates/category/${x.id}`} className="chip">
                {x.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
