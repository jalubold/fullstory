import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { loadOwnedProject } from '@/lib/server/project-loader';

export const metadata: Metadata = { title: 'Share & download', robots: { index: false } };

/** The editor's "Next": an unlocked album's share link, QR code and PDF live on its order page. */
async function Go({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project } = await loadOwnedProject(id, `/projects/${id}/checkout`);
  redirect(project.unlock_order_id ? `/orders/${project.unlock_order_id}` : `/projects/${id}/unlock`);
  return null;
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
      <Go params={params} />
    </Suspense>
  );
}
