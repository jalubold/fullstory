import type { Metadata } from 'next';
import Link from 'next/link';
import { TemplateBrowser } from '@/components/templates/TemplateBrowser';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { allTemplateDemos, browseMeta, browseOptions } from '@/lib/templates/browse';

export const metadata: Metadata = {
  title: 'Photo album templates',
  description: 'Browse professionally designed photobook templates for weddings, travel, family, babies, birthdays and more. Preview every page before you start.',
};

export default function TemplatesPage() {
  const demos = allTemplateDemos();
  const items = demos.map((d, i) => ({ ...browseMeta(d, i), node: <TemplateCard demo={d} eager={i < 3} /> }));
  return (
    <div className="container-page pb-24 pt-12">
      <header className="max-w-3xl">
        <p className="eyebrow">Template library</p>
        <h1 className="mt-3 font-serif text-5xl font-medium leading-tight md:text-6xl">Explore templates</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Complete, professionally designed albums for every kind of story. Preview every page with real photography, then make it yours.
        </p>
        <p className="mt-3 text-sm text-muted">
          Looking for a specific occasion?{' '}
          <Link href="/templates/categories" className="text-ink underline underline-offset-4">
            Browse by category
          </Link>
          .
        </p>
      </header>
      <h2 className="sr-only">All designs</h2>
      <div className="mt-12">
        <TemplateBrowser items={items} {...browseOptions()} />
      </div>
    </div>
  );
}
