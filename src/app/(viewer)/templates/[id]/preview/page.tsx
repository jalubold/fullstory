import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlbumViewer } from '@/components/album/AlbumViewer';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { categoryById, styleById } from '@/lib/templates/taxonomy';

/** All params are known at build time (generateStaticParams); opt out of unknown-param validation. */
export const instant = false;

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<'/templates/[id]/preview'>): Promise<Metadata> {
  const { id } = await params;
  const demo = getTemplateDemo(id);
  return demo ? { title: `${demo.template.name} — ${categoryById(demo.template.category)?.label} photo album`, description: demo.template.description } : {};
}

export default async function TemplatePreviewPage({ params }: PageProps<'/templates/[id]/preview'>) {
  const { id } = await params;
  const demo = getTemplateDemo(id);
  if (!demo) notFound();
  const t = demo.template;
  return (
    <AlbumViewer
      animationPicker
      doc={demo.doc}
      photos={demo.photos}
      title={t.name}
      subtitle={`${categoryById(t.category)?.label} · ${styleById(t.style)?.label} · Demo with sample photos — yours will hold your own`}
      backHref="/templates"
      backLabel="All designs"
      actions={
        <Link href={`/templates/${t.id}/start`} className="btn btn-primary btn-sm h-9 shrink-0 whitespace-nowrap px-3.5">
          Create your own
        </Link>
      }
    />
  );
}
