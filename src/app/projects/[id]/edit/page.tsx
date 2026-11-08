import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Editor } from '@/components/editor/Editor';
import { getCatalog, sizesFor } from '@/lib/commerce/catalog';
import { loadOwnedProject } from '@/lib/server/project-loader';

export const metadata: Metadata = { title: 'Editor', robots: { index: false } };

async function EditorLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, photos } = await loadOwnedProject(id, `/projects/${id}/edit`);
  const catalog = getCatalog();
  return (
    <Editor
      projectId={project.id}
      title={project.title}
      status={project.status}
      doc={project.document}
      version={Number(project.version)}
      updatedAt={new Date(project.updated_at).toISOString()}
      photos={photos}
      safeMarginMm={catalog.print.safeMarginMm}
      minDpi={catalog.print.minDpi}
      sizes={sizesFor(project.document.orientation).map((s) => ({ id: s.id, label: s.label, widthMm: s.widthMm, heightMm: s.heightMm }))}
    />
  );
}

export default function EditPage({ params }: PageProps<'/projects/[id]/edit'>) {
  return (
    <Suspense
      fallback={
        <div className="grid h-dvh place-items-center bg-editor">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      }
    >
      <EditorLoader params={params} />
    </Suspense>
  );
}
