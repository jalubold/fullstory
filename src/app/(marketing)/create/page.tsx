import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FilePlus2 } from 'lucide-react';
import { BookCover } from '@/components/album/Book';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { CATEGORIES } from '@/lib/templates/taxonomy';

export const metadata: Metadata = { title: 'Create a new album' };

export default function CreatePage() {
  return (
    <div className="container-page pb-16 pt-6 lg:pb-24 lg:pt-10">
      <header className="max-w-2xl">
        <h1 className="font-serif text-[2.5rem] font-medium leading-none md:text-6xl">What story are you telling?</h1>
        <p className="mt-3 text-ink-soft md:mt-4 md:text-lg">Pick an occasion — we’ll show the designs made for it.</p>
      </header>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:mt-12 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const t = TEMPLATES.find((x) => x.category === c.id);
          const d = t ? getTemplateDemo(t) : null;
          return (
            <Link key={c.id} href={`/templates?category=${c.id}`} className="group overflow-hidden rounded-[10px] border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98] sm:rounded-[4px]">
              <div className="grid aspect-[4/3] place-items-center bg-paper-2 transition-colors group-hover:bg-paper-3">
                {d && (
                  <BookCover
                    page={d.doc.cover}
                    size={d.doc.size}
                    photos={d.photos}
                    renderWidth={200}
                    style={{ width: d.template.orientation === 'landscape' ? '58%' : d.template.orientation === 'portrait' ? '36%' : '46%' }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:p-4">
                <div className="min-w-0">
                  <p className="font-serif text-[1.15rem] leading-tight sm:text-2xl">{c.label}</p>
                  <p className="hidden text-xs text-muted sm:block">{c.tagline}</p>
                </div>
                <ArrowRight size={16} className="hidden shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink sm:block" />
              </div>
            </Link>
          );
        })}
        <div className="col-span-2 flex flex-col justify-between rounded-[10px] border border-dashed border-line-strong bg-white p-5 sm:col-span-1 sm:rounded-[4px] sm:p-6">
          <div>
            <FilePlus2 size={28} strokeWidth={1.3} className="hidden text-accent sm:block" />
            <p className="font-serif text-2xl sm:mt-4">Start from a blank book</p>
            <p className="mt-1 text-sm text-muted">Simple, balanced layouts and plenty of room to make it your own.</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {(['square', 'landscape', 'portrait'] as const).map((o) => (
              <Link key={o} href={`/create/blank/${o}`} className="group flex flex-col items-center gap-2 rounded-xl border border-line px-2 py-3 text-xs text-ink-soft transition hover:border-accent hover:text-accent">
                <span className="block rounded-[2px] bg-paper-3 transition group-hover:bg-accent/20" style={{ width: o === 'portrait' ? 18 : 26, height: o === 'landscape' ? 18 : 26 }} />
                {o[0].toUpperCase() + o.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-10 text-sm text-muted">
        Already know what you want?{' '}
        <Link href="/templates" className="text-ink underline underline-offset-4">See all designs</Link>
      </p>
    </div>
  );
}
