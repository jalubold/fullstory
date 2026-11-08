'use client';

import { useMemo } from 'react';
import { Check, RotateCw, X } from 'lucide-react';
import { useEditor } from './store';
import { canRetry, dismissUpload, retryUpload } from './uploads';

/** Upload progress for a whole batch: one calm line instead of a row per file, plus anything that needs attention. */
/** Batch-level numbers: how many photos are going up, how many are done, overall progress. */
export function useUploadStats() {
  const uploads = useEditor((s) => s.uploads);
  return useMemo(() => {
    const live = uploads.filter((u) => u.status !== 'error');
    const done = live.filter((u) => u.status === 'done').length;
    const progress = live.length ? live.reduce((n, u) => n + (u.status === 'done' ? 1 : u.progress), 0) / live.length : 0;
    return { any: uploads.length > 0, live: live.length, done, progress, active: live.length > done, errors: uploads.filter((u) => u.status === 'error') };
  }, [uploads]);
}

export function UploadStatus({ compact = false }: { compact?: boolean }) {
  const stats = useUploadStats();
  if (!stats.any) return null;
  const finished = stats.live > 0 && stats.done === stats.live;

  return (
    <div aria-live="polite" className={compact ? 'space-y-3' : 'space-y-4'}>
      {stats.live > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium">
              {finished ? <Check size={15} className="text-success" /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
              {finished ? `${stats.live} ${stats.live === 1 ? 'photo' : 'photos'} uploaded` : `Uploading — ${stats.done} of ${stats.live} done`}
            </span>
            <span className="tabular-nums text-muted">{Math.round(stats.progress * 100)}%</span>
          </div>
          <div className="mt-2 h-[2px] overflow-hidden bg-line">
            <div className="h-full bg-accent transition-[width] duration-300 ease-out" style={{ width: `${stats.progress * 100}%` }} />
          </div>
          {!finished && !compact && <p className="mt-2 text-xs text-muted">Your photos are already in the album — uploads finish in the background, so you can keep going.</p>}
        </div>
      )}
      {stats.errors.length > 0 && (
        <ul className="space-y-1.5">
          {stats.errors.map((u) => (
            <li key={u.id} className="flex items-start gap-2 border-l-2 border-danger bg-white py-1.5 pl-2.5 pr-1 text-xs">
              <span className="min-w-0 flex-1 text-danger">{u.error ?? `${u.name} couldn’t be uploaded`}</span>
              {canRetry(u.id) && (
                <button type="button" onClick={() => retryUpload(u.id)} className="inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 font-medium text-ink hover:text-accent">
                  <RotateCw size={12} /> Retry
                </button>
              )}
              <button type="button" onClick={() => dismissUpload(u.id)} aria-label="Dismiss" className="shrink-0 p-0.5 text-muted hover:text-ink">
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** photoId → progress for photos that are visible but still uploading. */
export function usePendingUploads() {
  const uploads = useEditor((s) => s.uploads);
  return useMemo(() => {
    const m = new Map<string, number>();
    for (const u of uploads) if (u.photoId && u.status === 'uploading') m.set(u.photoId, u.progress);
    return m;
  }, [uploads]);
}

/** Tiles for photos that were picked but aren't ready to show yet — so a big batch never looks stuck. */
export function PendingTiles({ className = 'aspect-square rounded-[2px]' }: { className?: string }) {
  const count = useEditor((s) => s.uploads.filter((u) => !u.photoId && (u.status === 'queued' || u.status === 'uploading')).length);
  if (!count) return null;
  return (
    <>
      {Array.from({ length: Math.min(count, 60) }, (_, i) => (
        <div key={i} aria-hidden className={`skeleton grid place-items-center ${className}`}>
          {i === 0 && <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/60 border-t-transparent" />}
        </div>
      ))}
      <span className="sr-only">{count} photos are being prepared</span>
    </>
  );
}
