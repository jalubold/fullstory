import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { BookCover } from '@/components/album/Book';
import { SetupNotice } from '@/components/auth/SetupNotice';
import { NewProjectForm } from '@/components/create/NewProjectForm';
import { Steps } from '@/components/create/Steps';
import { getCatalog, sizesFor } from '@/lib/commerce/catalog';
import { getUser } from '@/lib/server/auth';
import { platformReady, setupIssues } from '@/lib/server/env';
import { getTemplate } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { categoryById } from '@/lib/templates/taxonomy';

export const metadata: Metadata = { title: 'Set up your album' };

async function Configure({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const templateId = typeof sp.template === 'string' ? sp.template : null;
  const template = templateId ? getTemplate(templateId) : null;
  const catalog = getCatalog();
  const next = template ? `/create/new?template=${template.id}` : '/create/new?blank=1';
  let user = null;
  try {
    user = await getUser();
  } catch {
    user = null;
  }
  const demo = template ? getTemplateDemo(template) : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
      <div className="order-2 lg:order-1">
        {demo ? (
          <div className="sticky top-24">
            <div className="grid aspect-square place-items-center rounded-[2rem] bg-paper-2">
              <BookCover page={demo.doc.cover} size={demo.doc.size} photos={demo.photos} renderWidth={480} style={{ width: template!.orientation === 'landscape' ? '76%' : template!.orientation === 'portrait' ? '50%' : '62%' }} />
            </div>
            <p className="mt-4 text-sm text-muted">
              {template!.name} · {categoryById(template!.category)?.label} · {demo.stats.pageCount} pages ·{' '}
              <Link href={`/templates/${template!.id}/preview`} className="underline underline-offset-4">Preview every page</Link>
            </p>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-paper-2 p-10">
            <p className="font-serif text-3xl">A blank book</p>
            <p className="mt-3 text-ink-soft">We’ll start you with simple, balanced layouts. Swap layouts, fonts and colours as you go.</p>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <h1 className="font-serif text-5xl font-medium">{template ? `Start with ${template.name}` : 'Start a blank album'}</h1>
        <p className="mb-8 mt-3 text-ink-soft">Name your album and pick a size. Designing is free — you only pay when you order.</p>
        {!platformReady ? (
          <SetupNotice issues={setupIssues()} />
        ) : !user ? (
          <div className="rounded-2xl border border-line bg-white p-7">
            <p className="font-serif text-2xl">Create a free account to save your album</p>
            <p className="mt-2 text-sm text-ink-soft">Your projects and photos are saved to your account so you can come back to them any time.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/signup?next=${encodeURIComponent(next)}`} className="btn btn-primary">Create account</Link>
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn btn-secondary">Log in</Link>
            </div>
          </div>
        ) : (
          <NewProjectForm
            templateId={template?.id ?? null}
            defaultTitle={template ? `My ${categoryById(template.category)?.label.toLowerCase()} album` : 'My photo album'}
            sizes={template ? sizesFor(template.orientation) : catalog.sizes}
            orientationChoice={!template}
            pages={catalog.pages}
          />
        )}
      </div>
    </div>
  );
}

export default function NewProjectPage({ searchParams }: PageProps<'/create/new'>) {
  return (
    <div className="container-page pb-24 pt-10">
      <Steps current={0} />
      <div className="mt-10">
        <Suspense fallback={<div className="h-96 skeleton rounded-3xl" />}>
          <Configure searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
