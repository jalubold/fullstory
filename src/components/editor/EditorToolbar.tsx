'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowRight, Check, CloudOff, Columns2, Eye, Loader2, Minus, Plus, Redo2, RectangleVertical, SlidersHorizontal, Undo2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useEditor } from './store';

function SaveIndicator({ onRetry }: { onRetry: () => void }) {
  const state = useEditor((s) => s.saveState);
  const map = {
    saved: { icon: <Check size={14} />, text: 'Saved', cls: 'text-muted' },
    dirty: { icon: <span className="h-1.5 w-1.5 rounded-full bg-warning" />, text: 'Unsaved changes', cls: 'text-muted' },
    saving: { icon: <Loader2 size={14} className="animate-spin" />, text: 'Saving…', cls: 'text-muted' },
    error: { icon: <CloudOff size={14} />, text: 'Offline — kept on this device', cls: 'text-warning' },
    conflict: { icon: <AlertCircle size={14} />, text: 'Changed elsewhere', cls: 'text-danger' },
  }[state];
  return (
    <button type="button" data-save-state={state} onClick={state === 'error' ? onRetry : undefined} className={`flex items-center gap-1.5 whitespace-nowrap text-xs ${map.cls}`} aria-live="polite" title={state === 'error' ? 'Retry now' : undefined}>
      {map.icon}
      <span className="hidden md:inline">{map.text}</span>
    </button>
  );
}

export function EditorToolbar({ save }: { save: () => Promise<boolean> }) {
  const router = useRouter();
  const projectId = useEditor((s) => s.projectId);
  const title = useEditor((s) => s.title);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const viewMode = useEditor((s) => s.viewMode);
  const zoom = useEditor((s) => s.zoom);
  const selectedId = useEditor((s) => s.selectedId);
  const { undo, redo, setViewMode, setZoom, setTitle, setPropsOpen } = useEditor.getState();
  const [leaving, setLeaving] = useState<string | null>(null);

  const go = async (href: string) => {
    setLeaving(href);
    await save();
    router.push(href);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-3">
      <Logo href="/dashboard" compact className="px-1.5" />
      <span className="h-6 w-px bg-line" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 120))}
        aria-label="Album name"
        className="w-28 min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1 font-serif text-lg hover:border-line focus:border-accent focus:outline-none sm:w-48 lg:w-64"
      />
      <SaveIndicator onRetry={() => void save()} />
      <div className="mx-auto flex items-center gap-1">
        <button type="button" className="btn btn-ghost btn-sm !p-2" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl/⌘ Z)">
          <Undo2 size={17} />
        </button>
        <button type="button" className="btn btn-ghost btn-sm !p-2" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl/⌘ Shift Z)">
          <Redo2 size={17} />
        </button>
        <span className="mx-1 hidden h-6 w-px bg-line md:block" />
        <div className="hidden rounded-lg bg-paper p-0.5 md:flex" role="group" aria-label="View">
          <button type="button" onClick={() => setViewMode('spread')} aria-pressed={viewMode === 'spread'} title="Double-page view" className={`rounded-md p-1.5 ${viewMode === 'spread' ? 'bg-white shadow-sm' : 'text-muted'}`}>
            <Columns2 size={16} />
          </button>
          <button type="button" onClick={() => setViewMode('single')} aria-pressed={viewMode === 'single'} title="Single-page view" className={`rounded-md p-1.5 ${viewMode === 'single' ? 'bg-white shadow-sm' : 'text-muted'}`}>
            <RectangleVertical size={16} />
          </button>
        </div>
        <div className="hidden items-center md:flex" role="group" aria-label="Zoom">
          <button type="button" className="btn btn-ghost btn-sm !p-1.5" onClick={() => setZoom(Math.round((zoom - 0.25) * 4) / 4)} disabled={zoom <= 0.5} aria-label="Zoom out">
            <Minus size={15} />
          </button>
          <button type="button" className="w-11 text-center text-xs tabular-nums text-ink-soft" onClick={() => setZoom(1)} title="Fit">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className="btn btn-ghost btn-sm !p-1.5" onClick={() => setZoom(Math.round((zoom + 0.25) * 4) / 4)} disabled={zoom >= 3} aria-label="Zoom in">
            <Plus size={15} />
          </button>
        </div>
      </div>
      <button type="button" className="btn btn-ghost btn-sm !p-2 xl:hidden" onClick={() => setPropsOpen(true)} aria-label="Properties" title="Properties">
        <SlidersHorizontal size={17} />
        {selectedId && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </button>
      <button type="button" onClick={() => go(`/projects/${projectId}/preview`)} className="btn btn-secondary btn-sm">
        {leaving?.endsWith('/preview') ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
        <span className="hidden sm:inline">Preview</span>
      </button>
      <button type="button" onClick={() => go(`/projects/${projectId}/checkout`)} className="btn btn-primary btn-sm">
        <span className="hidden sm:inline">Continue</span>
        {leaving?.endsWith('/checkout') ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
      </button>
      <Link href="/dashboard" className="sr-only">Back to dashboard</Link>
    </header>
  );
}
