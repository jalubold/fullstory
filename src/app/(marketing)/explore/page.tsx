import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OpenBook } from '@/components/album/Book';
import { buildSpreads } from '@/lib/album/geometry';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { categoryById, styleById } from '@/lib/templates/taxonomy';

export const metadata: Metadata = {
  title: 'Inspiration gallery',
  description: 'Spreads, layouts and story ideas from FULLSTORY photo albums — wedding, travel, family and more.',
};

const IDEAS = [
  { title: 'A year in review', text: 'Pick three favourite photos for every month. Twelve months later, you have a book.', href: '/templates/twelve-months' },
  { title: 'The first year', text: 'One page per month, with a short note about what changed. Simple, and priceless.', href: '/templates/first-year' },
  { title: 'Travel journal', text: 'Mix landscapes with tickets, menus and handwritten captions for a real diary feel.', href: '/templates/wanderlust-journal' },
  { title: 'Recipes & rituals', text: 'Photograph family recipes and Sunday traditions — and write down the stories behind them.', href: '/templates/sunday-album' },
  { title: 'A gift for two', text: 'Collect your favourite photos as a couple and add little notes only they will understand.', href: '/templates/two-of-us' },
  { title: 'Everyday joys', text: 'Pets, coffee, sunsets on the way home. The camera roll deserves a book too.', href: '/templates/little-things' },
];

export default function ExplorePage() {
  const gallery = TEMPLATES.map((t, i) => {
    const d = getTemplateDemo(t)!;
    const spreads = buildSpreads(d.doc.pages.length).filter((s) => s.left !== null && s.right !== null);
    const s = spreads[(i * 3 + 2) % spreads.length];
    return { d, s };
  });
  return (
    <div className="pb-24">
      <section className="container-page pt-12">
        <p className="eyebrow">Explore</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl font-medium leading-[1.03] md:text-6xl">Inspiration for your next album</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">Spreads from across the FULLSTORY collection, and a few ideas for stories worth telling.</p>
      </section>

      <section className="container-page mt-14 columns-1 gap-8 md:columns-2 xl:columns-3 [&>*]:mb-10 [&>*]:break-inside-avoid">
        {gallery.map(({ d, s }) => (
          <figure key={d.template.id} className="group">
            <Link href={`/templates/${d.template.id}/preview`} className="block rounded-[4px] bg-paper-2 p-6 transition-colors group-hover:bg-paper-3">
              <OpenBook left={d.doc.pages[s.left!]} right={d.doc.pages[s.right!]} size={d.doc.size} photos={d.photos} renderWidth={520} />
            </Link>
            <figcaption className="mt-3 flex items-baseline justify-between gap-3 px-1">
              <Link href={`/templates/${d.template.id}`} className="font-serif text-xl hover:text-accent-dark">
                {d.template.name}
              </Link>
              <span className="text-xs uppercase tracking-[0.14em] text-muted">
                {categoryById(d.template.category)?.label} · {styleById(d.template.style)?.label}
              </span>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="mt-12 bg-paper-2 py-20">
        <div className="container-page">
          <h2 className="font-serif text-4xl font-medium md:text-5xl">Story ideas</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {IDEAS.map((idea) => (
              <Link key={idea.title} href={idea.href} className="group card flex flex-col p-7 transition hover:shadow-card">
                <h3 className="font-serif text-2xl">{idea.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{idea.text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-ink group-hover:text-accent-dark">
                  See the template <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
