import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AlertTriangle, CheckCircle2, Eye, PenLine } from 'lucide-react';
import { BookCover } from '@/components/album/Book';
import { CheckoutForm } from '@/components/commerce/CheckoutForm';
import { Steps } from '@/components/create/Steps';
import { Logo } from '@/components/ui/Logo';
import { countPhotoFrames, effectiveDpi, pageSizePt } from '@/lib/album/geometry';
import { allPages } from '@/lib/album/ops';
import { getCatalog } from '@/lib/commerce/catalog';
import { getPaymentProvider } from '@/lib/server/payments';
import { loadOwnedProject } from '@/lib/server/project-loader';
import { getTemplate } from '@/lib/templates';

export const metadata: Metadata = { title: 'Export & order', robots: { index: false } };

async function Checkout({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { project, photos, user } = await loadOwnedProject(id, `/projects/${id}/checkout`);
  const catalog = getCatalog();
  const doc = project.document;
  const map = Object.fromEntries(photos.map((p) => [p.id, p]));
  const frames = countPhotoFrames(doc);
  const { w: Wpt, h: Hpt } = pageSizePt(doc.size);
  let lowRes = 0;
  for (const { page } of allPages(doc)) {
    for (const el of page.elements) {
      if (el.type !== 'photo' || !el.photoId || !map[el.photoId]) continue;
      const a = map[el.photoId];
      if (effectiveDpi(a.width, a.height, el.w * Wpt - el.borderWidth * 2, el.h * Hpt - el.borderWidth * 2, el.crop) < catalog.print.minDpi) lowRes++;
    }
  }
  const provider = getPaymentProvider();
  const template = doc.templateId ? getTemplate(doc.templateId) : null;
  const checks = [
    { ok: frames.filled > 0, text: frames.filled > 0 ? `${frames.filled} photos placed` : 'No photos placed yet' },
    { ok: frames.empty === 0, text: frames.empty === 0 ? 'No empty photo frames' : `${frames.empty} empty photo ${frames.empty === 1 ? 'frame prints' : 'frames print'} as blank space` },
    { ok: lowRes === 0, text: lowRes === 0 ? 'All photos are sharp enough to print' : `${lowRes} ${lowRes === 1 ? 'photo is' : 'photos are'} below ${catalog.print.minDpi} dpi and may look soft in print` },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
      <aside className="space-y-6">
        <div className="grid aspect-square place-items-center rounded-3xl bg-paper-2 p-6">
          <BookCover page={doc.cover} size={doc.size} photos={map} renderWidth={300} style={{ width: doc.orientation === 'landscape' ? '92%' : doc.orientation === 'portrait' ? '62%' : '78%' }} />
        </div>
        <div>
          <p className="font-serif text-2xl">{project.title}</p>
          <p className="text-sm text-muted">{doc.size.label} · {doc.pages.length} pages{template ? ` · ${template.name}` : ''}</p>
        </div>
        <ul className="space-y-2 text-sm">
          {checks.map((c) => (
            <li key={c.text} className={`flex gap-2 ${c.ok ? 'text-success' : 'text-warning'}`}>
              {c.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Link href={`/projects/${project.id}/preview`} className="btn btn-secondary btn-sm"><Eye size={14} /> Preview</Link>
          <Link href={`/projects/${project.id}/edit`} className="btn btn-ghost btn-sm"><PenLine size={14} /> Keep editing</Link>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Your order is made from the album exactly as it is now. You can keep editing afterwards — changes won’t affect this order.
        </p>
      </aside>
      <div>
        {typeof sp.cancelled === 'string' && <p className="mb-6 rounded-xl bg-paper-2 px-4 py-3 text-sm text-ink-soft">Payment was cancelled — nothing was charged. You can try again whenever you’re ready.</p>}
        {catalog.isSample && <p className="mb-6 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">Sample catalog: prices are placeholders from src/config/catalog.json.</p>}
        <CheckoutForm
          projectId={project.id}
          catalog={catalog}
          orientation={doc.orientation}
          sizeId={doc.size.id}
          pageCount={doc.pages.length}
          premium={template?.tier === 'premium'}
          provider={provider ? { label: provider.label, isTest: provider.isTest } : null}
          defaultName={user.name ?? ''}
          defaultEmail={user.email ?? ''}
        />
      </div>
    </div>
  );
}

export default function CheckoutPage({ params, searchParams }: PageProps<'/projects/[id]/checkout'>) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-white/70">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo href="/dashboard" />
          <Steps current={3} />
        </div>
      </header>
      <main className="container-page py-10">
        <h1 className="mb-8 font-serif text-4xl font-medium md:text-5xl">Export & order</h1>
        <Suspense fallback={<div className="h-[32rem] skeleton rounded-3xl" />}>
          <Checkout params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
