'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Copy, Eye, Loader2, MoreHorizontal, PenLine, Trash2, Type } from 'lucide-react';
import { BookCover } from '@/components/album/Book';
import type { ProjectSummaryLite } from './types';

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-paper-2 text-ink-soft' },
  completed: { label: 'Completed', cls: 'bg-success-soft text-success' },
  archived: { label: 'Archived', cls: 'bg-paper-2 text-muted' },
};

export function ProjectCard({ p }: { p: ProjectSummaryLite }) {
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

  const status = STATUS[p.status] ?? STATUS.draft;
  return (
    <article className="group relative">
      <Link href={`/projects/${p.id}/edit`} className="relative grid aspect-[4/3.2] place-items-center overflow-hidden rounded-[4px] bg-paper-2 transition-colors hover:bg-paper-3">
        <BookCover page={p.cover} size={p.size} photos={p.photos} renderWidth={240} style={{ width: p.size.widthMm > p.size.heightMm * 1.1 ? '68%' : p.size.heightMm > p.size.widthMm * 1.1 ? '42%' : '54%' }} />
        {busy && <span className="absolute inset-0 grid place-items-center bg-paper/60"><Loader2 className="animate-spin" /></span>}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl">{p.title}</h3>
          <p className="mt-0.5 text-xs text-muted">
            <span className={`badge mr-1.5 ${status.cls}`}>{status.label}</span>
            {p.pageCount} pages · edited {edited || '…'}
          </p>
        </div>
        <div className="relative" ref={ref}>
          <button type="button" className="btn btn-ghost btn-sm !p-1.5" aria-label="More actions" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <MoreHorizontal size={18} />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-pop">
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-paper" onClick={() => {
                const title = window.prompt('Rename album', p.title)?.trim();
                if (title) void act(() => fetch(`/api/projects/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) }));
              }}>
                <Type size={14} /> Rename
              </button>
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-paper" onClick={() => act(() => fetch(`/api/projects/${p.id}/duplicate`, { method: 'POST' }))}>
                <Copy size={14} /> Duplicate
              </button>
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
        <Link href={`/projects/${p.id}/edit`} className="btn btn-primary btn-sm"><PenLine size={14} /> Edit</Link>
        <Link href={`/projects/${p.id}/preview`} className="btn btn-secondary btn-sm"><Eye size={14} /> Preview</Link>
      </div>
    </article>
  );
}
