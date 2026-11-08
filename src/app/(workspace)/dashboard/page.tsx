import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { date, money, PAYMENT_LABEL } from '@/components/dashboard/format';
import { ProjectGrid } from '@/components/dashboard/ProjectGrid';
import { ForgetBrowser } from '@/components/dashboard/ForgetBrowser';
import { RecoveryLink } from '@/components/dashboard/RecoveryLink';
import type { AlbumExtras } from '@/components/dashboard/types';
import { recoveryToken, requireUser } from '@/lib/server/auth';
import { appUrl } from '@/lib/server/env';
import { listOrders, listShares } from '@/lib/server/repo/orders';
import { listProjects } from '@/lib/server/repo/projects';

export const metadata: Metadata = { title: 'My albums', robots: { index: false } };

/** What each bought album can do from its card. Orders come newest first, so the first match per album wins. */
function albumExtras(orders: Awaited<ReturnType<typeof listOrders>>, shares: Awaited<ReturnType<typeof listShares>>) {
  const extras: Record<string, AlbumExtras> = {};
  const projectOfOrder = new Map(orders.map((o) => [o.id, o.project_id]));
  for (const o of orders) {
    if (o.status !== 'paid') continue;
    const e = (extras[o.project_id] ??= {});
    e.orderId ??= o.id;
    if (!e.pdfOrderId && o.items.some((i) => i.kind === 'digital_pdf')) e.pdfOrderId = o.id;
  }
  const now = Date.now();
  for (const s of shares) {
    const live = s.enabled && s.status === 'paid' && !(s.expires_at && new Date(s.expires_at).getTime() < now);
    const projectId = projectOfOrder.get(s.order_id);
    if (!live || !projectId) continue;
    (extras[projectId] ??= {}).sharePath ??= `/share/${s.token}`;
  }
  return extras;
}

/**
 * Everything in one place: your albums, with what you can do with each one
 * right on its card. Orders and the private album link sit quietly below.
 */
async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser('/dashboard');
  const [projects, orders, shares] = await Promise.all([listProjects(user.id), listOrders(user.id), listShares(user.id)]);

  const extras = albumExtras(orders, shares);

  return (
    <div>
      {sp.restored === '1' && <p className="mb-8 rounded-[4px] bg-success-soft px-5 py-3 text-sm text-success">Welcome back — your albums are open in this browser again.</p>}
      {sp.restore === 'invalid' && <p className="mb-8 rounded-[4px] bg-danger-soft px-5 py-3 text-sm text-danger">That album link isn’t valid. Check you copied the whole link.</p>}

      <div className="border-b border-line pb-6">
        <h1 className="font-serif text-5xl font-medium leading-none md:text-6xl">My albums</h1>
        <p className="mt-3 text-ink-soft">Saved in this browser as you go — no account needed.</p>
      </div>

      <div className="mt-10">
        <ProjectGrid projects={projects} extras={extras} />
      </div>

      {orders.length > 0 && (
        <section className="mt-14 sm:mt-16">
          <h2 className="smallcaps">Orders &amp; receipts</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {orders.map((o) => {
              const pay = PAYMENT_LABEL[o.status];
              return (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3.5 text-sm hover:text-accent">
                    <span className="min-w-0">
                      <span className="font-medium">{o.number}</span>
                      <span className="ml-3 text-muted">{o.lines.map((l) => l.label).join(', ')}</span>
                    </span>
                    <span className="flex items-center gap-4 text-muted">
                      <span>{date(o.created_at)}</span>
                      <span className="tabular-nums text-ink">{money(o.amount_total, o.currency)}</span>
                      <span className={`badge ${pay.cls}`}>{pay.label}</span>
                      <ArrowUpRight size={14} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {user.exists && projects.length > 0 && (
        <div className="mt-14 sm:mt-16">
          <RecoveryLink
            url={`${appUrl()}/restore/${recoveryToken(user)}`}
            footer={
              <>
                <span className="text-muted">Using a shared computer?</span>
                <ForgetBrowser recoveryUrl={`${appUrl()}/restore/${recoveryToken(user)}`} />
              </>
            }
          />
        </div>
      )}
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
