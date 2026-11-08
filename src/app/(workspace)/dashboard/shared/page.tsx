import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ExternalLink, Lock, Settings2 } from 'lucide-react';
import { date } from '@/components/dashboard/format';
import { PageHeader } from '@/components/dashboard/ProjectGrid';
import { requireUser } from '@/lib/server/auth';
import { listShares } from '@/lib/server/repo/orders';

export const metadata: Metadata = { title: 'Share links', robots: { index: false } };

async function List() {
  const user = await requireUser('/dashboard/shared');
  const shares = await listShares(user.id);
  if (!shares.length) {
    return (
      <div className="rounded-[4px] border border-dashed border-line-strong bg-white/60 px-6 py-16 text-center">
        <p className="font-serif text-3xl">No shared albums yet</p>
        <p className="mt-2 text-sm text-ink-soft">Add a shareable album at checkout to get a private link you can send to anyone.</p>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {shares.map((s) => {
        const expired = !!s.expires_at && new Date(s.expires_at) < new Date();
        const live = s.enabled && !expired && s.status === 'paid';
        return (
          <li key={s.id} className="rounded-[4px] border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-2xl">{s.title}</p>
                <p className="mt-1 text-xs text-muted">Created {date(s.created_at)} · {s.view_count} views</p>
              </div>
              <span className={`badge ${live ? 'bg-success-soft text-success' : 'bg-paper-2 text-muted'}`}>{live ? 'Live' : expired ? 'Expired' : s.status !== 'paid' ? 'Unavailable' : 'Off'}</span>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
              {s.access === 'password' ? <><Lock size={13} /> Password protected</> : 'Anyone with the link'}
              {s.expires_at && <> · expires {date(s.expires_at)}</>}
            </p>
            <div className="mt-4 flex gap-2">
              <a href={`/share/${s.token}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink size={14} /> Open</a>
              <Link href={`/orders/${s.order_id}`} className="btn btn-ghost btn-sm"><Settings2 size={14} /> Manage</Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function SharedPage() {
  return (
    <>
      <PageHeader title="Share links" text="Private links to online versions of your albums." />
      <Suspense fallback={<div className="h-60 skeleton rounded-[4px]" />}>
        <List />
      </Suspense>
    </>
  );
}
