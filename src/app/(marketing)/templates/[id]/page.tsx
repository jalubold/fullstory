import { permanentRedirect } from 'next/navigation';
import { TEMPLATES } from '@/lib/templates';

/** All params are known at build time (generateStaticParams); opt out of unknown-param validation. */
export const instant = false;

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

/** Choosing a design opens its page-turning preview directly; old links land there too. */
export default async function TemplatePage({ params }: PageProps<'/templates/[id]'>) {
  const { id } = await params;
  permanentRedirect(`/templates/${id}/preview`);
}
