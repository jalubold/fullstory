import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { BookCover } from '@/components/album/Book';
import { SetupNotice } from '@/components/auth/SetupNotice';
import { StartAlbum } from '@/components/create/StartAlbum';
import { DEFAULT_THEME, buildPage } from '@/lib/album/build';
import type { Orientation } from '@/lib/album/types';
import { getCatalog, sizesFor } from '@/lib/commerce/catalog';
import { platformReady, setupIssues } from '@/lib/server/env';
import { getTemplate } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { categoryById } from '@/lib/templates/taxonomy';

export const metadata: Metadata = { title: 'Starting your album', robots: { index: false } };

async function Start({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const template = typeof sp.template === 'string' ? getTemplate(sp.template) : undefined;
  const orientation = (['square', 'landscape', 'portrait'] as const).includes(sp.orientation as Orientation) ? (sp.orientation as Orientation) : 'square';

  if (!platformReady) {
    return (
      <div className="container-page max-w-xl py-24">
        <h1 className="font-serif text-4xl">Albums aren’t available yet</h1>
        <div className="mt-6">
          <SetupNotice issues={setupIssues()} />
        </div>
        <Link href="/templates" className="btn btn-secondary">Back to templates</Link>
      </div>
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
