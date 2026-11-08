'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

export interface PickerItem {
  id: string;
  category: string;
  node: ReactNode;
}

export function TemplatePicker({ items, categories }: { items: PickerItem[]; categories: Array<{ id: string; label: string }> }) {
  const params = useSearchParams();
  const cat = params.get('category');
  const list = cat ? items.filter((i) => i.category === cat) : items;
  const others = cat ? items.filter((i) => i.category !== cat) : [];
  return (
    <div>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Occasion">
        {[{ id: '', label: 'All' }, ...categories].map((c) => {
          const on = c.id ? cat === c.id : !cat;
          return (
            <Link
              key={c.id || 'all'}
              href={c.id ? `/create/template?category=${c.id}` : '/create/template'}
              aria-current={on ? 'true' : undefined}
              scroll={false}
              className={`grid h-9 shrink-0 place-items-center rounded-full border px-4 text-[13px] sm:px-3.5 font-medium transition-colors active:scale-95 ${on ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-white text-ink-soft hover:border-ink hover:text-ink'}`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-6 grid gap-x-6 gap-y-10 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">{list.map((i) => <div key={i.id}>{i.node}</div>)}</div>
      {others.length > 0 && (
        <>
          <h2 className="mt-14 font-serif text-[1.75rem] sm:mt-16 sm:text-3xl">More designs you could use</h2>
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{others.map((i) => <div key={i.id}>{i.node}</div>)}</div>
        </>
      )}
    </div>
  );
}
