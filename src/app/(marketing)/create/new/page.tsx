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
      <section className="grain relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden bg-night text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora absolute -left-[15%] -top-[35%] h-[85%] w-[70%] rounded-full bg-accent/35 blur-[140px]" />
          <div className="aurora absolute -bottom-[40%] right-[-10%] h-[80%] w-[55%] rounded-full bg-violet/25 blur-[140px]" style={{ animationDelay: '-6s' }} />
        </div>
        <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <p className="eyebrow text-white/50">Album studio</p>
            <h1 className="rise mt-4 font-serif text-5xl leading-[1.05] sm:text-6xl">
              Opening <span className="text-gradient italic">very soon.</span>
            </h1>
            <p className="rise mt-5 text-lg text-white/70" style={{ animationDelay: '120ms' }}>
              Saving albums isn’t switched on for this site yet. Every template is ready to explore — flip through the demos and pick your favourite.
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: '220ms' }}>
              {template ? (
                <Link href={`/templates/${template.id}/preview`} className="btn btn-light">Flip through {template.name}</Link>
              ) : null}
              <Link href="/templates" className={template ? 'btn btn-outline-light' : 'btn btn-light'}>Browse templates</Link>
            </div>
            <p className="mt-12 max-w-md border-t border-white/10 pt-5 text-xs leading-relaxed text-white/40">
              For the site owner: albums and photos need a place to be saved. Connect Supabase in Vercel → Storage, then redeploy. Visitors never need an account.
            </p>
          </div>
          {demo ? (
            <div className="drop-in hidden w-[340px] lg:block" style={{ perspective: '1800px' }}>
              <div className="float-slow" style={{ transform: 'rotateY(-14deg) rotateX(4deg)' }}>
                <BookCover page={demo.doc.cover} size={demo.doc.size} photos={demo.photos} renderWidth={320} eager />
              </div>
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
    <Suspense fallback={<div className="min-h-[calc(100svh-4.5rem)] bg-night" />}>
      <Start searchParams={searchParams} />
    </Suspense>
  );
}
