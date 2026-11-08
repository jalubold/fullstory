'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Eye, Link2, Loader2, MoreHorizontal, PenLine, Receipt, Trash2, Type } from 'lucide-react';
import { BookCover } from '@/components/album/Book';
import { DownloadButton } from './OrderClient';
import { ShareQrButton } from './ShareQr';
import type { AlbumExtras, ProjectSummaryLite } from './types';

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

function CopyShare({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${path}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink"
    >
      {copied ? <Check size={13} className="text-success" /> : <Link2 size={13} />} {copied ? 'Link copied' : 'Copy share link'}
    </button>
  );
}

export function ProjectCard({ p, extras }: { p: ProjectSummaryLite; extras?: AlbumExtras }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [edited, setEdited] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Relative time depends on the viewer's clock, so it is computed after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEdited(timeAgo(p.updatedAt));
  }, [p.updatedAt]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const act = async (fn: () => Promise<Response>, after?: (r: Response) => Promise<void> | void) => {
    setBusy(true);
    setMenu(false);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      if (after) await after(res);
      else router.refresh();
    } else alert('Something went wrong. Please try again.');
  };

  const ordered = !!extras?.orderId;
  return (
    <article className="group relative rounded-[10px] border border-line bg-white p-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
      <div className="flex gap-4 sm:block">
      <Link href={`/projects/${p.id}/edit`} className="relative grid aspect-[1/1.1] w-[5.5rem] shrink-0 place-items-center overflow-hidden rounded-[6px] bg-paper-2 transition-colors hover:bg-paper-3 active:opacity-80 sm:aspect-[4/3.2] sm:w-auto sm:rounded-[4px]">
        <div className="w-[78%] sm:w-[var(--cover-w)]" style={{ ['--cover-w' as string]: p.size.widthMm > p.size.heightMm * 1.1 ? '68%' : p.size.heightMm > p.size.widthMm * 1.1 ? '42%' : '54%' }}>
          <BookCover page={p.cover} size={p.size} photos={p.photos} renderWidth={240} style={{ width: '100%' }} />
        </div>
        {busy && <span className="absolute inset-0 grid place-items-center bg-paper/60"><Loader2 className="animate-spin" /></span>}
      </Link>
      <div className="min-w-0 flex-1 sm:mt-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[1.2rem] leading-tight sm:text-xl">{p.title}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {ordered && <span className="badge mr-1.5 bg-success-soft text-success">Ordered</span>}
            {p.pageCount} pages · edited {edited || '…'}
          </p>
        </div>
        <div className="relative" ref={ref}>
          <button type="button" className="btn btn-ghost btn-sm !p-1.5" aria-label="More actions" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <MoreHorizontal size={18} />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-[4px] border border-line bg-white py-1 shadow-pop">
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-paper" onClick={() => {
                const title = window.prompt('Rename album', p.title)?.trim();
                if (title) void act(() => fetch(`/api/projects/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) }));
              }}>
                <Type size={14} /> Rename
              </button>
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-paper" onClick={() => act(() => fetch(`/api/projects/${p.id}/duplicate`, { method: 'POST' }))}>
                <Copy size={14} /> Duplicate
              </button>
              {extras?.orderId && (
                <Link href={`/orders/${extras.orderId}`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-paper">
                  <Receipt size={14} /> Order &amp; receipt
                </Link>
              )}
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft" onClick={() => {
                if (window.confirm(`Delete “${p.title}”? This can’t be undone.`)) void act(() => fetch(`/api/projects/${p.id}`, { method: 'DELETE' }));
              }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/projects/${p.id}/edit`} className="btn btn-primary btn-sm h-10 sm:h-auto"><PenLine size={14} /> Continue</Link>
        <Link href={`/projects/${p.id}/preview`} className="btn btn-secondary btn-sm h-10 sm:h-auto"><Eye size={14} /> Preview</Link>
      </div>
      </div>
      </div>
      {(extras?.pdfOrderId || extras?.sharePath) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3">
          {extras.pdfOrderId && <DownloadButton orderId={extras.pdfOrderId} label="Download PDF" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink [&>svg]:h-[13px] [&>svg]:w-[13px]" />}
          {extras.sharePath && <CopyShare path={extras.sharePath} />}
          {extras.sharePath && <ShareQrButton token={extras.sharePath.split('/').pop()!} />}
        </div>
      )}
    </article>
  );
}
