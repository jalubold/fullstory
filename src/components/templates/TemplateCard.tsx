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
      <Link href={`/templates/${t.id}`} className="relative block aspect-[1/0.92] overflow-hidden rounded-[4px] bg-paper-2 transition-transform active:scale-[0.98] sm:rounded-none" aria-label={`${t.name} — view design`}>
        <TemplateVisual demo={demo} eager={eager} />
        <span className="folio absolute right-2.5 top-2 !text-[0.75rem] !text-muted sm:right-4 sm:top-3.5 sm:!text-[0.95rem]">No. {String(no).padStart(2, '0')}</span>
      </Link>
      <div className="mt-2.5 flex items-baseline justify-between gap-3 sm:mt-4 sm:border-b sm:border-line sm:pb-3">
        <h3 className="font-serif text-[1.3rem] leading-tight text-ink sm:text-[1.75rem] sm:leading-none">
          <Link href={`/templates/${t.id}`} className="transition-colors hover:text-accent">
            {t.name}
          </Link>
        </h3>
        <span className="smallcaps hidden shrink-0 sm:inline">{category?.label}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted sm:mt-1.5">
        <span className="sm:hidden">{category?.label}</span>
        <span className="hidden sm:inline">{style?.label}</span> · {stats.pageCount} pages
      </p>
    </article>
  );
}
