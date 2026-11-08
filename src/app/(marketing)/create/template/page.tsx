import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, Eye } from 'lucide-react';
import { BookCover } from '@/components/album/Book';
import { Steps } from '@/components/create/Steps';
import { TemplatePicker } from '@/components/create/TemplatePicker';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { CATEGORIES, styleById } from '@/lib/templates/taxonomy';

export const metadata: Metadata = { title: 'Choose a design' };

export default function TemplateSelectPage() {
  const items = TEMPLATES.map((t) => {
    const d = getTemplateDemo(t)!;
    return {
      id: t.id,
      category: t.category,
      node: (
        <div className="group">
          <Link href={`/create/new?template=${t.id}`} className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[12px] bg-paper-2 transition active:scale-[0.99] sm:aspect-square sm:rounded-[4px] sm:hover:bg-paper-3" aria-label={`Use ${t.name}`}>
            <BookCover page={d.doc.cover} size={d.doc.size} photos={d.photos} renderWidth={240} style={{ width: t.orientation === 'landscape' ? '64%' : t.orientation === 'portrait' ? '40%' : '50%' }} />
            {t.tier === 'premium' && <span className="smallcaps absolute left-3.5 top-3 !text-[0.625rem] !text-accent">Premium</span>}
          </Link>
          <p className="mt-3 font-serif text-[1.5rem] leading-tight sm:text-xl">{t.name}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {styleById(t.style)?.label} · {d.stats.pageCount} pages · {t.orientation[0].toUpperCase() + t.orientation.slice(1)}
          </p>
          <div className="mt-3.5 flex gap-2.5">
            <Link href={`/templates/${t.id}/preview`} className="btn btn-secondary h-12 shrink-0 gap-2 px-4 text-[0.8125rem] sm:h-11" aria-label={`Preview ${t.name}`}>
              <Eye size={17} /> Preview
            </Link>
            <Link href={`/create/new?template=${t.id}`} className="btn btn-primary h-12 min-w-0 flex-1 gap-2 text-[0.75rem] uppercase tracking-[0.14em] sm:h-11">
              Use this design <ArrowRight size={16} className="shrink-0" />
            </Link>
          </div>
        </div>
      ),
    };
  });
  return (
    <div className="container-page pb-16 pt-6 lg:pb-24 lg:pt-10">
      <div className="hidden lg:block">
        <Steps current={0} />
      </div>
      <header className="max-w-2xl lg:mt-8">
        <h1 className="font-serif text-[2.5rem] font-medium leading-none md:text-5xl">Choose a design</h1>
        <p className="mt-3 text-ink-soft">Free to design. Preview any one to see every page.</p>
      </header>
      <div className="mt-6 lg:mt-10">
        <Suspense fallback={<div className="h-96 skeleton rounded-[4px]" />}>
          <TemplatePicker items={items} categories={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} />
        </Suspense>
      </div>
    </div>
  );
}
