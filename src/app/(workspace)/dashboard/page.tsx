import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, Download, Plus } from 'lucide-react';
import { DownloadButton } from '@/components/dashboard/OrderClient';
import { date } from '@/components/dashboard/format';
import { ProjectGrid } from '@/components/dashboard/ProjectGrid';
import { RecoveryLink } from '@/components/dashboard/RecoveryLink';
import { recoveryToken, requireUser } from '@/lib/server/auth';
import { appUrl } from '@/lib/server/env';
import { listOrders } from '@/lib/server/repo/orders';
import { listProjects } from '@/lib/server/repo/projects';

export const metadata: Metadata = { title: 'My albums', robots: { index: false } };

async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser('/dashboard');
  const [projects, orders] = await Promise.all([listProjects(user.id), listOrders(user.id)]);
  const drafts = projects.filter((p) => p.status === 'draft');
  const completed = projects.filter((p) => p.status === 'completed');
  const downloads = orders.filter((o) => o.status === 'paid' && o.items.some((i) => i.kind === 'digital_pdf'));
  const first = user.name?.split(' ')[0];
  return (
    <div className="space-y-14">
      {sp.restored === '1' && <p className="rounded-[4px] bg-success-soft px-5 py-3 text-sm text-success">Welcome back — your albums are open in this browser again.</p>}
      {sp.restore === 'invalid' && <p className="rounded-[4px] bg-danger-soft px-5 py-3 text-sm text-danger">That album link isn’t valid. Check you copied the whole link.</p>}
      <div className="cloth relative overflow-hidden px-6 py-12 sm:px-10 sm:py-14">
        <span aria-hidden className="ribbon absolute right-[12%] top-0 hidden h-[78%] w-6 sm:block" />
        <p className="smallcaps !text-white/60">{first ? `Welcome back, ${first}` : 'Your bookshelf'}</p>
        <h1 className="mt-4 max-w-xl font-serif text-4xl font-medium leading-[0.95] md:text-6xl">
          Your stories, <span className="italic">all in one place.</span>
        </h1>
        <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-5">
          {[
            [projects.length, 'albums'],
            [drafts.length, 'drafts'],
            [orders.filter((o) => o.status === 'paid').length, 'orders'],
          ].map(([n, label]) => (
            <div key={label}>
              <dt className="smallcaps !text-white/55">{label}</dt>
              <dd className="mt-1 font-serif text-4xl italic">{n}</dd>
            </div>
          ))}
        </dl>
        <Link href="/create" className="btn btn-light btn-lg mt-10 text-[0.75rem] uppercase tracking-[0.2em]"><Plus size={15} /> Begin a new book</Link>
      </div>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-3xl">Recent albums</h2>
          {projects.length > 3 && <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">All projects <ArrowRight size={14} /></Link>}
        </div>
        <ProjectGrid projects={projects.slice(0, 3)} />
      </section>

      {drafts.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-3xl">Draft albums</h2>
            <Link href="/dashboard/drafts" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">All drafts <ArrowRight size={14} /></Link>
          </div>
          <ProjectGrid projects={drafts.slice(0, 3)} />
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-3xl">Completed albums</h2>
            <Link href="/dashboard/completed" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">View all <ArrowRight size={14} /></Link>
          </div>
          <ProjectGrid projects={completed.slice(0, 3)} />
        </section>
      )}

      {user.exists && projects.length > 0 && <RecoveryLink url={`${appUrl()}/restore/${recoveryToken(user)}`} />}

      <section>
        <h2 className="mb-6 font-serif text-3xl">Purchased downloads</h2>
        {downloads.length ? (
          <ul className="divide-y divide-line rounded-[4px] border border-line bg-white">
            {downloads.slice(0, 5).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{o.number}</p>
                  <p className="text-xs text-muted">Purchased {date(o.paid_at)}</p>
                </div>
                <DownloadButton orderId={o.id} className="btn btn-secondary btn-sm" label="Download PDF" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 rounded-[4px] border border-dashed border-line-strong px-5 py-6 text-sm text-muted">
            <Download size={16} /> Digital PDFs you buy will appear here.
          </p>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  return (
    <Suspense fallback={<div className="h-96 skeleton rounded-[4px]" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
