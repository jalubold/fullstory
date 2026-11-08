import Link from 'next/link';
import type { TemplateDemo } from '@/lib/templates/demo';
import { categoryById, styleById } from '@/lib/templates/taxonomy';
import { BookCover, FlatPage } from '@/components/album/Book';

const COVER_WIDTH = { square: 50, landscape: 60, portrait: 41 } as const;
const PAGE_WIDTH = { square: 44, landscape: 52, portrait: 36 } as const;

export function TemplateVisual({ demo, eager }: { demo: TemplateDemo; eager?: boolean }) {
  const { doc, photos, template } = demo;
  const interior = doc.pages.find((p, i) => i > 0 && p.elements.some((e) => e.type === 'photo')) ?? doc.pages[1];
  const o = template.orientation;
  return (
    <div className="absolute inset-0">
      <FlatPage
        page={interior}
        size={doc.size}
        photos={photos}
        renderWidth={260}
        eager={eager}
        className="absolute transition-transform duration-700 ease-[var(--ease-soft)] group-hover:translate-x-[8%] group-hover:rotate-[7deg]"
        style={{ width: `${PAGE_WIDTH[o]}%`, right: '9%', top: '50%', transform: 'translateY(-50%) rotate(2.5deg)' }}
      />
      <BookCover
        page={doc.cover}
        size={doc.size}
        photos={photos}
        renderWidth={300}
        eager={eager}
        className="shine absolute transition-transform duration-700 ease-[var(--ease-soft)] group-hover:-translate-x-[4%] group-hover:-translate-y-[3%] group-hover:-rotate-2 group-hover:scale-[1.03]"
        style={{ width: `${COVER_WIDTH[o]}%`, left: '10%', top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
}

export function TemplateCard({ demo, eager }: { demo: TemplateDemo; eager?: boolean }) {
  const { template: t, stats } = demo;
  const category = categoryById(t.category);
  const style = styleById(t.style);
  return (
    <article className="group flex flex-col">
      <Link
        href={`/templates/${t.id}`}
        className="relative block aspect-[5/4] overflow-hidden rounded-3xl bg-gradient-to-br from-paper-2 to-paper-3 transition-all duration-500 group-hover:shadow-pop"
        aria-label={`${t.name} — view template`}
      >
        <TemplateVisual demo={demo} eager={eager} />
        {t.tier === 'premium' && <span className="badge absolute left-3 top-3 bg-ink text-white">Premium</span>}
        <span className="absolute bottom-3 right-3 translate-y-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink opacity-0 shadow-card backdrop-blur transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">View design →</span>
      </Link>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-[1.6rem] leading-none text-ink">
          <Link href={`/templates/${t.id}`} className="hover:text-accent-dark">
            {t.name}
          </Link>
        </h3>
        <span className="shrink-0 text-xs text-muted">{stats.pageCount} pages</span>
      </div>
      <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-muted">
        {category?.label} · {style?.label}
      </p>
      <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-soft/85">{t.summary}</p>
      <div className="mt-4 flex gap-2">
        <Link href={`/templates/${t.id}/preview`} className="btn btn-secondary btn-sm">
          Preview
        </Link>
        <Link href={`/create/new?template=${t.id}`} className="btn btn-primary btn-sm">
          Use Template
        </Link>
      </div>
    </article>
  );
}
