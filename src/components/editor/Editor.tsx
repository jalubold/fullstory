'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ImagePlus } from 'lucide-react';
import { duplicateElement, pageAt, removeElement } from '@/lib/album/ops';
import type { AlbumDocument, PageSize, PhotoAsset } from '@/lib/album/types';
import { WelcomeTips } from './WelcomeTips';
import { MobileEditor } from './mobile/MobileEditor';
import { AlbumCanvas } from './AlbumCanvas';
import { EditorSidebar } from './EditorSidebar';
import { EditorToolbar } from './EditorToolbar';
import { PageNavigator } from './PageNavigator';
import { PropertiesPanel } from './PropertiesPanel';
import { useEditor } from './store';
import { backupKey, useAutosave, type LocalBackup } from './useAutosave';
import { uploadFiles } from './uploads';

export interface EditorProps {
  projectId: string;
  title: string;
  status: string;
  doc: AlbumDocument;
  version: number;
  updatedAt: string;
  photos: PhotoAsset[];
  safeMarginMm: number;
  minDpi: number;
  sizes: PageSize[];
}

/** Phones (and phones held sideways) get the simple editor: change photos, rewrite text, nothing moves. */
const PHONE_QUERY = '(max-width: 767px), (pointer: coarse) and (max-height: 500px)';
const subscribePhone = (cb: () => void) => {
  const m = window.matchMedia(PHONE_QUERY);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const usePhone = () => useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
};

export function Editor(props: EditorProps) {
  const ready = useEditor((s) => s.projectId === props.projectId && !!s.doc);
  const [restore, setRestore] = useState<LocalBackup | null>(null);
  const [fileDrag, setFileDrag] = useState(false);
  const phone = usePhone();
  const propsOpen = useEditor((s) => s.propsOpen);
  const saveState = useEditor((s) => s.saveState);
  const toasts = useEditor((s) => s.toasts);
  const save = useAutosave();

  useEffect(() => {
    useEditor.getState().init({ projectId: props.projectId, title: props.title, status: props.status, doc: props.doc, version: props.version, photos: props.photos, sizes: props.sizes });
    try {
      const raw = localStorage.getItem(backupKey(props.projectId));
      if (raw) {
        const b = JSON.parse(raw) as LocalBackup;
        // Local backups live in browser storage, which is only readable after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (b.at > Date.parse(props.updatedAt) && JSON.stringify(b.doc) !== JSON.stringify(props.doc)) setRestore(b);
        else localStorage.removeItem(backupKey(props.projectId));
      }
    } catch {}
    if (window.innerWidth < 1024) useEditor.getState().setPanel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.projectId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
        return;
      }
      if (isTyping(e.target)) return;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        s.redo();
        return;
      }
      const page = pageAt(s.doc, s.active);
      const el = page?.elements.find((x) => x.id === s.selectedId);
      if (e.key === 'Escape') {
        if (s.croppingId || s.editingTextId) {
          s.setCropping(null);
          s.setEditingText(null);
        } else s.select(null);
        return;
      }
      if (!el) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        s.apply((d) => {
          const pg = pageAt(d, s.active);
          if (pg) removeElement(pg, el.id);
        });
        s.select(null);
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        let id = '';
        s.apply((d) => {
          const pg = pageAt(d, s.active);
          if (pg) id = duplicateElement(pg, el.id)?.id ?? '';
        });
        if (id) s.select(id);
      } else if (e.key === 'Enter' && el.type === 'text') {
        e.preventDefault();
        s.setEditingText(el.id);
      } else if (e.key.startsWith('Arrow') && !el.locked) {
        e.preventDefault();
        const step = e.shiftKey ? 0.01 : 0.002;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        s.updateElement(s.active, el.id, { x: el.x + dx, y: el.y + dy }, { key: `nudge:${el.id}` });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  if (!ready) {
    return (
      <div className="grid h-dvh place-items-center bg-editor">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const banners = (
    <>
      {restore && (
        <div className="flex flex-wrap items-center gap-3 border-b border-warning/30 bg-warning-soft px-4 py-2 text-sm text-warning">
          <span className="flex-1">We found changes on this device that weren’t saved ({new Date(restore.at).toLocaleString()}).</span>
          <button
            type="button"
            className="btn btn-sm bg-warning text-white"
            onClick={() => {
              const s = useEditor.getState();
              s.apply((d) => Object.assign(d, restore.doc));
              if (restore.title) s.setTitle(restore.title);
              setRestore(null);
              s.toast('Unsaved changes restored', 'success');
            }}
          >
            Restore
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { localStorage.removeItem(backupKey(props.projectId)); setRestore(null); }}>
            Discard
          </button>
        </div>
      )}
      {saveState === 'conflict' && <ConflictBar onKeepMine={async () => {
        const res = await fetch(`/api/projects/${props.projectId}`);
        if (res.ok) {
          const data = await res.json();
          const s = useEditor.getState();
          s.setVersion(data.version);
          s.apply(() => {}, {});
          useEditor.setState({ saveState: 'dirty', changeCounter: s.changeCounter + 1 });
          void save();
        }
      }} />}
    </>
  );

  if (phone) return <MobileEditor save={save} banners={banners} />;

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-editor text-ink"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setFileDrag(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setFileDrag(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setFileDrag(false);
        useEditor.getState().setPanel('photos');
        void uploadFiles([...e.dataTransfer.files]);
      }}
    >
      <EditorToolbar save={save} />
      {banners}
      <div className="relative flex min-h-0 flex-1">
        <EditorSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <AddPhotosPrompt />
          <AlbumCanvas safeMarginMm={props.safeMarginMm} />
          <PageNavigator />
        </div>
        <div className={`${propsOpen ? 'absolute inset-y-0 right-0 z-30 shadow-pop' : 'hidden'} xl:static xl:block xl:shadow-none`}>
          <PropertiesPanel minDpi={props.minDpi} />
        </div>
      </div>
      <WelcomeTips />
      {fileDrag && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-10 py-8 shadow-pop">
            <ImagePlus size={28} className="text-accent-dark" />
            <p className="font-serif text-2xl">Drop photos to upload</p>
          </div>
        </div>
      )}
      <div className="pointer-events-none fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto rounded-full px-4 py-2 text-sm shadow-pop animate-fade-up ${t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-paper'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConflictBar({ onKeepMine }: { onKeepMine: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger">
      <span className="flex-1">This album was changed in another window or device. Your latest changes haven’t been saved.</span>
      <button type="button" className="btn btn-sm border border-danger/40" onClick={() => window.location.reload()}>
        Load the latest version
      </button>
      <button type="button" className="btn btn-sm bg-danger text-white" onClick={onKeepMine}>
        Keep my version
      </button>
    </div>
  );
}

/** Shown over the canvas until the album has photos: one obvious way to begin. */
function AddPhotosPrompt() {
  const empty = useEditor((s) => s.photos.length === 0 && s.uploads.length === 0);
  const input = useRef<HTMLInputElement>(null);
  if (!empty) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-4 rounded-[4px] border border-line-strong bg-card py-2.5 pl-4 pr-2.5 shadow-[0_18px_40px_-20px_rgb(19_12_13/.45)] animate-fade-up">
        <span className="hidden text-sm text-ink-soft sm:inline">Start with your photos — drop them anywhere, they fill the pages for you.</span>
        <span className="text-sm text-ink-soft sm:hidden">Start with your photos.</span>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles([...e.target.files]);
            e.target.value = '';
          }}
        />
        <button type="button" onClick={() => input.current?.click()} className="btn btn-primary btn-sm shrink-0 uppercase tracking-[0.16em] !text-[0.6875rem]">
          <ImagePlus size={14} /> Add photos
        </button>
      </div>
    </div>
  );
}
