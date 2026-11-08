import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { BookCover } from '@/components/album/Book';
import { StartAlbum } from '@/components/create/StartAlbum';
import { DEFAULT_THEME, buildPage } from '@/lib/album/build';
import type { Orientation } from '@/lib/album/types';
import { getCatalog, sizesFor } from '@/lib/commerce/catalog';
import { platformReady } from '@/lib/server/env';
import { getTemplate } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { categoryById } from '@/lib/templates/taxonomy';

export const metadata: Metadata = { title: 'Starting your album', robots: { index: false } };

async function Start({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const template = typeof sp.template === 'string' ? getTemplate(sp.template) : undefined;
  const orientation = (['square', 'landscape', 'portrait'] as const).includes(sp.orientation as Orientation) ? (sp.orientation as Orientation) : 'square';

  if (!platformReady) {
    const demo = template ? getTemplateDemo(template) : null;
    return (
      <section className="cloth relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden">
        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <p className="smallcaps !text-white/60">The studio</p>
            <h1 className="rise mt-5 font-serif text-5xl font-medium leading-[0.95] sm:text-7xl">
              Opening <span className="italic">very soon.</span>
            </h1>
            <p className="rise mt-6 text-lg text-white/75" style={{ animationDelay: '120ms' }}>
              Saving albums isn’t switched on for this site yet. Every design is ready to explore — flip through the demos and choose your favourite.
            </p>
            <div className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ animationDelay: '220ms' }}>
              {template ? (
                <Link href={`/templates/${template.id}/preview`} className="btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]">
                  Flip through {template.name}
                </Link>
              ) : null}
              <Link href="/templates" className={template ? 'text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white' : 'btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]'}>
                {template ? <span className="link-underline">Browse the collection</span> : 'Browse the collection'}
              </Link>
            </div>
            <p className="mt-14 max-w-md border-t border-white/15 pt-5 text-xs leading-relaxed text-white/45">
              For the site owner: albums and photos need a place to be saved. Connect Supabase in Vercel → Storage, then redeploy. Visitors never need an account.
            </p>
          </div>
          {demo ? (
            <div className="book-in hidden w-[320px] shadow-[0_40px_60px_-30px_rgb(0_0_0/.6)] lg:block">
              <BookCover page={demo.doc.cover} size={demo.doc.size} photos={demo.photos} renderWidth={320} eager />
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (template) {
    const demo = getTemplateDemo(template)!;
    const size = sizesFor(template.orientation)[0];
    return (
      <StartAlbum
        title={template.name}
        request={{ templateId: template.id, sizeId: size.id, title: `My ${categoryById(template.category)?.label.toLowerCase()} album` }}
        visual={<BookCover page={demo.doc.cover} size={demo.doc.size} photos={demo.photos} renderWidth={300} eager />}
      />
    );
  }

  const size = sizesFor(orientation)[0] ?? getCatalog().sizes[0];
  const cover = buildPage('cover-type', DEFAULT_THEME, size, { texts: ['A new album', 'Our Story', 'Every page is yours'] });
  return (
    <StartAlbum
      title="your album"
      request={{ templateId: null, sizeId: size.id, title: 'My photo album', pageCount: getCatalog().pages.default }}
      visual={<BookCover page={cover} size={size} photos={{}} renderWidth={300} />}
    />
  );
}

export default function NewAlbumPage({ searchParams }: PageProps<'/create/new'>) {
  return (
    <Suspense fallback={<div className="cloth min-h-[calc(100svh-4.5rem)]" />}>
      <Start searchParams={searchParams} />
    </Suspense>
  );
}
