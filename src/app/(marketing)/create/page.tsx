import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FilePlus2 } from 'lucide-react';
import { BookCover } from '@/components/album/Book';
import { Steps } from '@/components/create/Steps';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { CATEGORIES } from '@/lib/templates/taxonomy';

export const metadata: Metadata = { title: 'Create a new album' };

export default function CreatePage() {
  return (
    <div className="container-page pb-24 pt-10">
      <Steps current={0} />
      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-5xl font-medium md:text-6xl">What story are you telling?</h1>
        <p className="mt-4 text-lg text-ink-soft">Pick an occasion and we’ll show you designs made for it. You can change anything later.</p>
      </header>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const t = TEMPLATES.find((x) => x.category === c.id);
          const d = t ? getTemplateDemo(t) : null;
          return (
            <Link key={c.id} href={`/create/template?category=${c.id}`} className="group overflow-hidden rounded-[4px] border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-card">
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
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-serif text-2xl">{c.label}</p>
                  <p className="text-xs text-muted">{c.tagline}</p>
                </div>
                <ArrowRight size={16} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </div>
            </Link>
          );
        })}
        <div className="flex flex-col justify-between rounded-[4px] border border-dashed border-line-strong bg-white p-6">
          <div>
            <FilePlus2 size={28} strokeWidth={1.3} className="text-accent" />
            <p className="mt-4 font-serif text-2xl">Start from a blank book</p>
            <p className="mt-1 text-sm text-muted">Simple, balanced layouts and plenty of room to make it your own.</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {(['square', 'landscape', 'portrait'] as const).map((o) => (
              <Link key={o} href={`/create/new?blank=1&orientation=${o}`} className="group flex flex-col items-center gap-2 rounded-xl border border-line px-2 py-3 text-xs text-ink-soft transition hover:border-accent hover:text-accent">
                <span className="block rounded-[2px] bg-paper-3 transition group-hover:bg-accent/20" style={{ width: o === 'portrait' ? 18 : 26, height: o === 'landscape' ? 18 : 26 }} />
                {o[0].toUpperCase() + o.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-10 text-sm text-muted">
        Already know what you want?{' '}
        <Link href="/create/template" className="text-ink underline underline-offset-4">See all templates</Link>
      </p>
    </div>
  );
}
