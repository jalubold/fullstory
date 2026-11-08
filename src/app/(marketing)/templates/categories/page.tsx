import type { Metadata } from 'next';
import Link from 'next/link';
import { BookCover } from '@/components/album/Book';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { CATEGORIES } from '@/lib/templates/taxonomy';

export const metadata: Metadata = {
  title: 'Template categories',
  description: 'Photo album templates for weddings, travel, family, couples, babies, birthdays, graduations, anniversaries and everyday memories.',
};

export default function CategoriesPage() {
  return (
    <div className="container-page pb-24 pt-12">
      <header className="max-w-2xl">
        <p className="eyebrow">Categories</p>
        <h1 className="mt-3 font-serif text-5xl font-medium md:text-6xl">Every kind of story</h1>
        <p className="mt-4 text-lg text-ink-soft">Start with the occasion. Each collection is designed around the photos you are most likely to have.</p>
      </header>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const templates = TEMPLATES.filter((t) => t.category === c.id);
          const demo = templates[0] ? getTemplateDemo(templates[0]) : null;
          return (
            <Link key={c.id} href={`/templates/category/${c.id}`} className="group overflow-hidden rounded-3xl border border-line bg-white transition hover:shadow-card">
              <div className="relative grid aspect-[16/10] place-items-center bg-paper-2 transition-colors group-hover:bg-paper-3">
                {demo && (
                  <BookCover
                    page={demo.doc.cover}
                    size={demo.doc.size}
                    photos={demo.photos}
                    renderWidth={260}
                    className="transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-[1.03]"
                    style={{ width: demo.template.orientation === 'landscape' ? '52%' : demo.template.orientation === 'portrait' ? '32%' : '42%' }}
                  />
                )}
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-serif text-3xl">{c.label}</h2>
                  <span className="text-xs text-muted">{templates.length} {templates.length === 1 ? 'template' : 'templates'}</span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{c.tagline}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
