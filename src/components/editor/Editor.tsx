'use client';

import { useEffect, useState } from 'react';
import type { AlbumDocument, PageSize, PhotoAsset } from '@/lib/album/types';
import { SimpleEditor } from './simple/SimpleEditor';
import { useEditor } from './store';
import { backupKey, useAutosave, type LocalBackup } from './useAutosave';

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

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
};

/**
 * Loads the album into the editor store, keeps it saved, and shows the
 * simple editor: add photos, change photos, rewrite text, choose music and
 * page turns. Layout, position and size are the designer's job, so nothing on
 * a page can be moved — that keeps every album looking finished.
 */
export function Editor(props: EditorProps) {
  const ready = useEditor((s) => s.projectId === props.projectId && !!s.doc);
  const [restore, setRestore] = useState<LocalBackup | null>(null);
  const saveState = useEditor((s) => s.saveState);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.projectId]);

  // Save, undo and redo from the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 's') {
        e.preventDefault();
        void save();
        return;
      }
      if (isTyping(e.target)) return;
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (k === 'y') {
        e.preventDefault();
        s.redo();
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
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              localStorage.removeItem(backupKey(props.projectId));
              setRestore(null);
            }}
          >
            Discard
          </button>
        </div>
      )}
      {saveState === 'conflict' && (
        <ConflictBar
          onKeepMine={async () => {
            const res = await fetch(`/api/projects/${props.projectId}`);
            if (res.ok) {
              const data = await res.json();
              const s = useEditor.getState();
              s.setVersion(data.version);
              s.apply(() => {}, {});
              useEditor.setState({ saveState: 'dirty', changeCounter: s.changeCounter + 1 });
              void save();
            }
          }}
        />
      )}
    </>
  );

  return <SimpleEditor save={save} banners={banners} minDpi={props.minDpi} />;
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
