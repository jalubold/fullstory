import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Check } from 'lucide-react';
import { BookCover } from '@/components/album/Book';
import { OpenAlbum, UnlockButton } from '@/components/commerce/UnlockClient';
import { OrderStatusPoller } from '@/components/dashboard/OrderClient';
import { Logo } from '@/components/ui/Logo';
import { formatMoney, getCatalog, priceIn } from '@/lib/commerce/catalog';
import { INCLUDED } from '@/lib/commerce/included';
import { countryFromHeaders } from '@/lib/commerce/region';
import { requireUser } from '@/lib/server/auth';
import { checkoutCurrency, syncOrder } from '@/lib/server/orders';
import { getPaymentProvider } from '@/lib/server/payments';
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
  const demo = template ? getTemplateDemo(template) : null;
  const provider = getPaymentProvider();
  const doc = demo?.doc ?? project.document;

  return (
    <Screen wide>
      <div className="grid items-center gap-10 text-left lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="mx-auto w-[min(17rem,62vw)] lg:w-full lg:max-w-[22rem]">
          <div className="book-in shadow-[0_40px_60px_-30px_rgb(0_0_0/.6)]">
            <BookCover page={doc.cover} size={doc.size} photos={demo?.photos ?? {}} renderWidth={360} eager />
          </div>
        </div>
        <div>
          {order && (order.status === 'failed' || order.status === 'cancelled') && (
            <p className="mb-5 rounded-[6px] bg-white/10 px-4 py-3 text-sm text-white/85">That payment didn’t go through — nothing was charged. You can try again below.</p>
          )}
          <p className="smallcaps !text-white/60">{template ? template.name : 'Your album'}</p>
          <h1 className="mt-3 font-serif text-[2.6rem] font-medium leading-[1.02] md:text-6xl">
            Make it <span className="italic">yours.</span>
          </h1>
          <p className="mt-4 text-white/75">
            <span className="font-serif text-3xl text-white">{price}</span>
            <span className="ml-2">one-time · everything included</span>
          </p>
          <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {INCLUDED.map((f) => (
              <li key={f.id} className="flex items-start gap-2.5 text-sm text-white/85">
                <Check size={16} className="mt-0.5 shrink-0 text-white" /> {f.title}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <UnlockButton projectId={project.id} label={`Unlock & start — ${price}`} />
          </div>
          <p className="mt-3 text-xs text-white/55">
            {provider?.id === 'creem' ? 'Secure checkout by Creem · taxes included' : 'Secure checkout'} · No account needed
          </p>
          <Link href="/templates" className="mt-6 inline-block text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white/80 hover:text-white">
            <span className="link-underline">Back to the designs</span>
          </Link>
        </div>
      </div>
    </Screen>
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
