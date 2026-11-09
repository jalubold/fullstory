import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { OpenAlbum } from '@/components/commerce/UnlockClient';
import { SalesPage } from '@/components/sales/SalesPage';
import { OrderStatusPoller } from '@/components/dashboard/OrderClient';
import { Logo } from '@/components/ui/Logo';
import { formatMoney, getCatalog, priceIn } from '@/lib/commerce/catalog';
import { countryFromHeaders } from '@/lib/commerce/region';
import { requireUser } from '@/lib/server/auth';
import { appUrl } from '@/lib/server/env';
import { checkoutCurrency, syncOrder } from '@/lib/server/orders';
import { getOwnedOrder } from '@/lib/server/repo/orders';
import { listProjectPhotos } from '@/lib/server/repo/photos';
import { getProject } from '@/lib/server/repo/projects';
import { getTemplate } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';

export const metadata: Metadata = { title: 'Your album', robots: { index: false } };

async function Unlock({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/projects/${id}/unlock`);
  let project = await getProject(user.id, id);
  if (!project) notFound();

  // Back from checkout: confirm the payment with the provider (the webhook may not have arrived yet).
  let order = typeof sp.order === 'string' ? await getOwnedOrder(user.id, sp.order) : null;
  if (order && order.project_id !== project.id) order = null;
  if (order) {
    order = await syncOrder(order);
    if (order.status === 'paid') project = (await getProject(user.id, id)) ?? project;
  }

  if (project.unlocked_at) {
    const hasPhotos = (await listProjectPhotos(project.id)).length > 0;
    return (
      <Screen>
        <OpenAlbum projectId={project.id} hasPhotos={hasPhotos} />
        <h1 className="font-serif text-4xl font-medium md:text-5xl">
          Thank you — <span className="italic">it’s yours.</span>
        </h1>
        <p className="mt-3 text-white/70">Opening your album…</p>
        <div className="mx-auto mt-8 h-px w-56 overflow-hidden bg-white/20">
          <div className="h-full w-1/3 animate-[fs-progress_1.2s_ease-in-out_infinite] bg-white" />
        </div>
      </Screen>
    );
  }

  if (order?.status === 'pending' && typeof sp.order === 'string') {
    return (
      <Screen>
        <OrderStatusPoller orderId={order.id} status={order.status} />
        <h1 className="font-serif text-4xl font-medium md:text-5xl">Confirming your payment…</h1>
        <p className="mt-3 text-white/70">This takes a few seconds. The page continues on its own.</p>
        <div className="mx-auto mt-8 h-px w-56 overflow-hidden bg-white/20">
          <div className="h-full w-1/3 animate-[fs-progress_1.2s_ease-in-out_infinite] bg-white" />
        </div>
      </Screen>
    );
  }

  const catalog = getCatalog();
  const currency = checkoutCurrency(countryFromHeaders(await headers()));
  const amount = priceIn(catalog.album.price, currency);
  const price = amount === null ? '' : formatMoney(amount, currency);
  const template = project.template_id ? getTemplate(project.template_id) : null;
  const demo = (template ? getTemplateDemo(template) : null) ?? getTemplateDemo('slow-days')!;
  const failed = order && (order.status === 'failed' || order.status === 'cancelled');

  return (
    <div className="min-h-dvh bg-paper">
      <header className="cloth">
        <div className="container-page flex h-14 items-center justify-between lg:h-16">
          <Logo tone="light" />
          <Link href="/dashboard" className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/75 hover:text-white">
            My albums
          </Link>
        </div>
      </header>
      <SalesPage
        demo={demo}
        name={template ? template.name : project.title}
        price={price}
        siteUrl={appUrl()}
        target={{ projectId: project.id }}
        notice={failed ? <p className="mb-6 rounded-[6px] bg-white/10 px-4 py-3 text-sm text-white/85">That payment didn’t go through — nothing was charged. You can try again below.</p> : undefined}
      />
    </div>
  );
}

function Screen({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="cloth relative flex min-h-dvh flex-col overflow-hidden">
      <header className="container-page flex h-14 shrink-0 items-center lg:h-16">
        <Logo tone="light" />
      </header>
      <main className="container-page flex flex-1 items-center justify-center py-10">
        <div className={`w-full ${wide ? 'max-w-5xl' : 'max-w-md text-center'}`}>{children}</div>
      </main>
    </div>
  );
}

export default function UnlockPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="cloth min-h-dvh" />}>
      <Unlock params={params} searchParams={searchParams} />
    </Suspense>
  );
}
