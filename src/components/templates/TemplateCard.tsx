import Link from 'next/link';
import { TEMPLATES } from '@/lib/templates';
import type { TemplateDemo } from '@/lib/templates/demo';
import { categoryById, styleById } from '@/lib/templates/taxonomy';
import { BookCover, FlatPage } from '@/components/album/Book';

const BOOK_WIDTH = { square: 62, landscape: 74, portrait: 50 } as const;

/**
 * A closed book resting on the page. On hover its cover swings open on the
 * spine to show the first designed spread page underneath.
 */
export function TemplateVisual({ demo, eager }: { demo: TemplateDemo; eager?: boolean }) {
  const { doc, photos, template } = demo;
  const interior = doc.pages.find((p, i) => i > 0 && p.elements.some((e) => e.type === 'photo')) ?? doc.pages[1];
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative" style={{ width: `${BOOK_WIDTH[template.orientation]}%`, perspective: '1600px' }}>
        <FlatPage page={interior} size={doc.size} photos={photos} renderWidth={300} eager={eager} className="shadow-[0_24px_40px_-24px_rgb(19_12_13/0.45)]" />
        <div
          className="absolute inset-0 origin-left transition-transform duration-[900ms] ease-[var(--ease-soft)] [transform-style:preserve-3d] group-hover:[transform:rotateY(-62deg)]"
          style={{ transform: 'rotateY(0deg)' }}
        >
          <BookCover page={doc.cover} size={doc.size} photos={photos} renderWidth={300} eager={eager} />
        </div>
      </div>
    </div>
  );
}

export function TemplateCard({ demo, eager }: { demo: TemplateDemo; eager?: boolean }) {
  const { template: t, stats } = demo;
  const no = TEMPLATES.findIndex((x) => x.id === t.id) + 1;
  const category = categoryById(t.category);
  const style = styleById(t.style);
  return (
    <article className="group flex flex-col">
      <Link href={`/templates/${t.id}`} className="relative block aspect-[1/0.92] overflow-hidden bg-paper-2" aria-label={`${t.name} — view design`}>
        <TemplateVisual demo={demo} eager={eager} />
        {t.tier === 'premium' && <span className="smallcaps absolute left-4 top-4 !text-[0.625rem] !text-accent">Premium</span>}
        <span className="folio absolute right-4 top-3.5">No. {String(no).padStart(2, '0')}</span>
      </Link>
      <div className="mt-4 flex items-baseline justify-between gap-3 border-b border-line pb-3">
        <h3 className="font-serif text-[1.75rem] leading-none text-ink">
          <Link href={`/templates/${t.id}`} className="transition-colors hover:text-accent">
            {t.name}
          </Link>
        </h3>
        <span className="smallcaps shrink-0">{category?.label}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">{t.summary}</p>
      <p className="mt-1 text-xs text-muted">
        {style?.label} · {stats.pageCount} pages
      </p>
      <div className="mt-4 flex items-center gap-6 text-[0.6875rem] font-medium uppercase tracking-[0.2em]">
        <Link href={`/create/new?template=${t.id}`} className="link-underline text-accent">
          Use this design
        </Link>
        <Link href={`/templates/${t.id}/preview`} className="text-ink-soft transition-colors hover:text-ink">
          Flip through
        </Link>
      </div>
    </article>
  );
}
