'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isMobileDevice } from '@/lib/client/device';

/** Payment confirmed: straight into the album (phones to the editor, desktops add a batch of photos first). */
export function OpenAlbum({ projectId, hasPhotos }: { projectId: string; hasPhotos: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const url = isMobileDevice() || hasPhotos ? `/projects/${projectId}/edit` : `/projects/${projectId}/photos`;
    router.replace(url);
    const t = window.setTimeout(() => window.location.replace(url), 6000);
    return () => window.clearTimeout(t);
  }, [projectId, hasPhotos, router]);
  return null;
}
