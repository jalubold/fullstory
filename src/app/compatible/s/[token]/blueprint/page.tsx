import type { Metadata } from 'next';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { BlueprintReport } from '@/components/compat/BlueprintReport';
import { CompatHeader } from '@/components/compat/Shell';
import { InvalidLink } from '@/components/compat/Stages';
import { loadBlueprint, loadView } from '@/lib/compat/server/view';

export const metadata: Metadata = { title: 'The Relationship Blueprint', robots: { index: false, follow: false }, referrer: 'no-referrer' };

async function Report({ params }: { params: Promise<{ token: string }> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { token } = await params;
  const found = await loadView(token);
  if (!found) return <InvalidLink />;
  // Access control: both must have finished, and the assessment must be paid for.
  if (found.view.stage !== 'results' || !found.view.unlocked) redirect(`/compatible/s/${token}`);
  const bp = await loadBlueprint(found.ctx);
  if (!bp) redirect(`/compatible/s/${token}`);
  const generated = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <main id="main" className="flex-1">
      <BlueprintReport bp={bp} token={token} generated={generated} />
    </main>
  );
}

export default function BlueprintPage({ params }: PageProps<'/compatible/s/[token]/blueprint'>) {
  return (
    <>
      <CompatHeader />
      <Suspense fallback={<div className="min-h-[60vh] bg-awc-wine-deep" />}>
        <Report params={params} />
      </Suspense>
    </>
  );
}
