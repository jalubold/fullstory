import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight, Download, Plus } from 'lucide-react';
import { DownloadButton } from '@/components/dashboard/OrderClient';
import { date } from '@/components/dashboard/format';
import { ProjectGrid } from '@/components/dashboard/ProjectGrid';
import { requireUser } from '@/lib/server/auth';
import { listOrders } from '@/lib/server/repo/orders';
import { listProjects } from '@/lib/server/repo/projects';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } };

async function Content() {
  const user = await requireUser('/dashboard');
  const [projects, orders] = await Promise.all([listProjects(user.id), listOrders(user.id)]);
  const drafts = projects.filter((p) => p.status === 'draft');
  const completed = projects.filter((p) => p.status === 'completed');
  const downloads = orders.filter((o) => o.status === 'paid' && o.items.some((i) => i.kind === 'digital_pdf'));
  const first = user.name?.split(' ')[0];
  return (
    <div className="space-y-14">
      <div className="relative overflow-hidden rounded-3xl bg-paper-2 px-6 py-10 sm:px-10">
        <p className="eyebrow">{first ? `Welcome back, ${first}` : 'Welcome'}</p>
        <h1 className="mt-3 max-w-xl font-serif text-4xl font-medium leading-tight md:text-5xl">Your stories, all in one place.</h1>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-ink-soft">
          <span><span className="font-serif text-2xl text-ink">{projects.length}</span> albums</span>
          <span><span className="font-serif text-2xl text-ink">{drafts.length}</span> drafts</span>
          <span><span className="font-serif text-2xl text-ink">{orders.filter((o) => o.status === 'paid').length}</span> orders</span>
        </div>
        <Link href="/create" className="btn btn-primary btn-lg mt-8"><Plus size={16} /> Create New Album</Link>
      </div>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-3xl">Recent projects</h2>
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

      <section>
        <h2 className="mb-6 font-serif text-3xl">Purchased downloads</h2>
        {downloads.length ? (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
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
          <p className="flex items-center gap-2 rounded-2xl border border-dashed border-line-strong px-5 py-6 text-sm text-muted">
            <Download size={16} /> Digital PDFs you buy will appear here.
          </p>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-96 skeleton rounded-3xl" />}>
      <Content />
    </Suspense>
  );
}
