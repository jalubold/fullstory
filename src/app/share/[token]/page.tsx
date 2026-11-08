import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { Download } from 'lucide-react';
import { AlbumViewer } from '@/components/album/AlbumViewer';
import { ShareUnlock } from '@/components/commerce/ShareUnlock';
import { Logo } from '@/components/ui/Logo';
import { usedPhotoIds } from '@/lib/album/geometry';
import type { PhotoMap } from '@/lib/album/types';
import { bumpShareViews, getShareByToken, hasItem } from '@/lib/server/repo/orders';
import { shareAccess } from '@/lib/server/shares';
import { presentationOf } from '@/lib/album/presentation';
import { getProjectPresentation } from '@/lib/server/repo/projects';

export const metadata: Metadata = { title: 'Shared album', robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-5">
      <div className="w-full max-w-sm text-center">
        <Logo className="justify-center" />
        <div className="mt-10 rounded-3xl border border-line bg-white p-8 text-left">{children}</div>
        <p className="mt-6 text-xs text-muted">
          Made with <Link href="/" className="underline underline-offset-2">FULLSTORY</Link>
        </p>
      </div>
    </div>
  );
}

async function Shared({ params }: { params: Promise<{ token: string }> }) {
  // Access depends on the visitor's cookie and the link's expiry: always render per request.
  await connection();
  const { token } = await params;
  const share = await getShareByToken(token);
  const access = await shareAccess(share);
  if (access.state === 'unavailable') {
    return (
      <Shell>
        <h1 className="font-serif text-3xl">Album unavailable</h1>
        <p className="mt-2 text-sm text-ink-soft">{access.reason}</p>
      </Shell>
    );
  }
  if (access.state === 'locked') {
    return (
      <Shell>
        <h1 className="font-serif text-3xl">{share!.title}</h1>
        <p className="mb-6 mt-2 text-sm text-ink-soft">This album is password protected.</p>
        <ShareUnlock token={token} />
      </Shell>
    );
  }
  await bumpShareViews(share!.id);
  const order = access.order;
  const doc = order.document_snapshot;
  const presentation = presentationOf({ presentation: (await getProjectPresentation(order.project_id)) ?? doc.presentation });
  const photos: PhotoMap = {};
  for (const id of usedPhotoIds(doc)) {
    const m = order.photo_manifest[id];
    if (m) photos[id] = { id, width: m.width, height: m.height, thumbUrl: `/api/share/${token}/photos/${id}/thumb`, displayUrl: `/api/share/${token}/photos/${id}/display`, placeholder: '#E8E2D8' };
  }
  return (
    <AlbumViewer
      doc={doc}
      photos={photos}
      title={share!.title}
      subtitle="A FULLSTORY album"
      presentation={presentation}
      actions={
        share!.allow_download && hasItem(order, 'digital_pdf') ? (
          <a href={`/api/share/${token}/download`} className="btn btn-secondary btn-sm">
            <Download size={15} /> <span className="hidden sm:inline">Download</span>
          </a>
        ) : (
          <Link href="/" className="btn btn-ghost btn-sm">Make your own</Link>
        )
      }
    />
  );
}

export default function SharePage({ params }: PageProps<'/share/[token]'>) {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#140d0e]" />}>
      <Shared params={params} />
    </Suspense>
  );
}
