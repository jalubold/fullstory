import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AlbumViewer } from '@/components/album/AlbumViewer';
import { countPhotoFrames } from '@/lib/album/geometry';
import { loadOwnedProject } from '@/lib/server/project-loader';

export const metadata: Metadata = { title: 'Album preview', robots: { index: false } };

async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, photos } = await loadOwnedProject(id, `/projects/${id}/preview`);
  const doc = project.document;
  const map = Object.fromEntries(photos.map((p) => [p.id, p]));
  const frames = countPhotoFrames(doc);
  return (
    <AlbumViewer
      doc={doc}
      photos={map}
      title={project.title}
      subtitle={`${doc.size.label} · ${doc.pages.length} pages · Preview of your current design`}
      backHref={`/projects/${project.id}/edit`}
      backLabel="Back to editor"
      banner={
        frames.empty > 0 ? (
          <div className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-xs text-warning">
            <AlertTriangle size={14} /> {frames.empty} photo {frames.empty === 1 ? 'frame is' : 'frames are'} still empty. Empty frames print as blank space.
          </div>
        ) : undefined
      }
      actions={
        <Link href={`/projects/${project.id}/checkout`} className="btn btn-primary btn-sm">
          Continue
        </Link>
      }
    />
  );
}

export default function ProjectPreviewPage({ params }: PageProps<'/projects/[id]/preview'>) {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#EAE5DC]" />}>
      <Preview params={params} />
    </Suspense>
  );
}
