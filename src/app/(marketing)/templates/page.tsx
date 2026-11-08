import type { Metadata } from 'next';
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
    <div className="container-page pb-16 pt-6 lg:pb-24 lg:pt-12">
      <header className="max-w-2xl">
        <h1 className="font-serif text-[2.5rem] font-medium leading-none md:text-6xl">Choose a design</h1>
        <p className="mt-3 text-ink-soft md:mt-4 md:text-lg">Every page is ready — just add your photos.</p>
      </header>
      <h2 className="sr-only">All designs</h2>
      <div className="mt-6 lg:mt-10">
        <TemplateBrowser items={items} {...browseOptions()} />
      </div>
    </div>
  );
}
