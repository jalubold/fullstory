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
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        <Link href="/create/template" className="chip" data-active={!cat}>
          All
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/create/template?category=${c.id}`} className="chip" data-active={cat === c.id}>
            {c.label}
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{list.map((i) => <div key={i.id}>{i.node}</div>)}</div>
      {others.length > 0 && (
        <>
          <h2 className="mt-16 font-serif text-3xl">More designs you could use</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{others.map((i) => <div key={i.id}>{i.node}</div>)}</div>
        </>
      )}
    </div>
  );
}
