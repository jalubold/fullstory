import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PhotoUploadStep } from '@/components/create/PhotoUploadStep';
import { Steps } from '@/components/create/Steps';
import { Logo } from '@/components/ui/Logo';
import { loadOwnedProject } from '@/lib/server/project-loader';

export const metadata: Metadata = { title: 'Add your photos', robots: { index: false } };

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, photos } = await loadOwnedProject(id, `/projects/${id}/photos`);
  return (
    <>
      <h1 className="font-serif text-4xl font-medium md:text-5xl">Add your photos</h1>
      <p className="mb-8 mt-3 max-w-2xl text-ink-soft">
        Upload the photos for <span className="text-ink">{project.title}</span>. They stay private to your account and can be used on any page.
      </p>
      <PhotoUploadStep projectId={project.id} title={project.title} status={project.status} doc={project.document} version={Number(project.version)} photos={photos} />
    </>
  );
}

export default function PhotosStepPage({ params }: PageProps<'/projects/[id]/photos'>) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-white/70">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo href="/dashboard" />
          <Steps current={1} />
        </div>
      </header>
      <main className="container-page max-w-5xl py-12">
        <Suspense fallback={<div className="h-96 skeleton rounded-3xl" />}>
          <Loader params={params} />
        </Suspense>
      </main>
    </div>
  );
}
