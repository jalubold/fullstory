import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { DownloadButton } from '@/components/dashboard/OrderClient';
import { date } from '@/components/dashboard/format';
import { PageHeader } from '@/components/dashboard/ProjectGrid';
import { requireUser } from '@/lib/server/auth';
import { listOrders } from '@/lib/server/repo/orders';

export const metadata: Metadata = { title: 'My Downloads', robots: { index: false } };

async function List() {
  const user = await requireUser('/dashboard/downloads');
  const orders = (await listOrders(user.id)).filter((o) => o.items.some((i) => i.kind === 'digital_pdf') && (o.status === 'paid' || o.status === 'pending'));
  if (!orders.length) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong bg-white/60 px-6 py-16 text-center">
        <p className="font-serif text-3xl">No downloads yet</p>
        <p className="mt-2 text-sm text-ink-soft">When you buy a digital PDF of an album, you can download it here at any time.</p>
        <Link href="/dashboard/projects" className="btn btn-secondary mt-6">Go to my projects</Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
      {orders.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="font-medium">{(o as unknown as { cover_page?: { elements: Array<{ type: string; role?: string; text?: string }> } }).cover_page?.elements.find((e) => e.type === 'text' && e.role === 'title')?.text ?? 'Album'} </p>
            <p className="text-xs text-muted">
              Order <Link href={`/orders/${o.id}`} className="underline underline-offset-2">{o.number}</Link> · {o.status === 'paid' ? `purchased ${date(o.paid_at)}` : 'payment pending'}
            </p>
          </div>
          {o.status === 'paid' ? <DownloadButton orderId={o.id} className="btn btn-primary btn-sm" /> : <span className="badge bg-warning-soft text-warning">Awaiting payment</span>}
        </li>
      ))}
    </ul>
  );
}

export default function DownloadsPage() {
  return (
    <>
      <PageHeader title="My Downloads" text="High-resolution PDFs of the albums you’ve purchased." />
      <Suspense fallback={<div className="h-60 skeleton rounded-3xl" />}>
        <List />
      </Suspense>
    </>
  );
}
