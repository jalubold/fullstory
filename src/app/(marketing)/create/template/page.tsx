import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Eye } from 'lucide-react';
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
          <Link href={`/create/new?template=${t.id}`} className="relative grid aspect-square place-items-center rounded-[4px] bg-paper-2 transition-colors hover:bg-paper-3">
            <BookCover page={d.doc.cover} size={d.doc.size} photos={d.photos} renderWidth={240} style={{ width: t.orientation === 'landscape' ? '72%' : t.orientation === 'portrait' ? '48%' : '60%' }} />
            {t.tier === 'premium' && <span className="badge absolute left-3 top-3 bg-ink text-paper">Premium</span>}
          </Link>
          <div className="mt-3 flex items-start justify-between gap-2">
            <div>
              <p className="font-serif text-xl">{t.name}</p>
              <p className="text-xs text-muted">{styleById(t.style)?.label} · {d.stats.pageCount} pages · {t.orientation}</p>
            </div>
            <Link href={`/templates/${t.id}/preview`} className="btn btn-ghost btn-sm !px-2" aria-label={`Preview ${t.name}`}>
              <Eye size={15} />
            </Link>
          </div>
          <Link href={`/create/new?template=${t.id}`} className="btn btn-primary btn-sm mt-3 w-full">
            Select
          </Link>
        </div>
      ),
    };
  });
  return (
    <div className="container-page pb-24 pt-10">
      <Steps current={0} />
      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-5xl font-medium">Choose a design</h1>
        <p className="mt-3 text-ink-soft">Every design is free to customise. Preview any template to see every page first.</p>
      </header>
      <div className="mt-10">
        <Suspense fallback={<div className="h-96 skeleton rounded-[4px]" />}>
          <TemplatePicker items={items} categories={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} />
        </Suspense>
      </div>
    </div>
  );
}
