import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { Download } from 'lucide-react';
import { AlbumViewer } from '@/components/album/AlbumViewer';
import { ShareUnlock } from '@/components/commerce/ShareUnlock';
import { ClothScreen } from '@/components/ui/ClothScreen';
import { usedPhotoIds } from '@/lib/album/geometry';
import type { PhotoMap } from '@/lib/album/types';
import { bumpShareViews, getShareByToken, hasItem } from '@/lib/server/repo/orders';
import { shareAccess } from '@/lib/server/shares';
import { presentationOf } from '@/lib/album/presentation';
import { getProjectPresentation } from '@/lib/server/repo/projects';

export const metadata: Metadata = { title: 'Shared album', robots: { index: false, follow: false } };

async function Shared({ params }: { params: Promise<{ token: string }> }) {
  // Access depends on the visitor's cookie and the link's expiry: always render per request.
  await connection();
  const { token } = await params;
  const share = await getShareByToken(token);
  const access = await shareAccess(share);
  if (access.state === 'unavailable') {
    return (
      <ClothScreen kicker="A shared album" title={<>This album has been <span className="italic">put away.</span></>} colophon>
        <p className="mx-auto mt-5 max-w-sm text-white/70">{access.reason}</p>
        <Link href="/" className="btn btn-light btn-lg mt-10 text-[0.75rem] uppercase tracking-[0.2em]">
          Make an album of your own
        </Link>
      </ClothScreen>
    );
  }
  if (access.state === 'locked') {
    return (
      <ClothScreen kicker="A private album" title={share!.title} colophon>
        <p className="mx-auto mt-5 max-w-sm text-white/70">Whoever sent you this link added a password. Enter it to open the album.</p>
        <ShareUnlock token={token} />
      </ClothScreen>
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
