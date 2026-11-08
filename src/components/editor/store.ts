'use client';

import { create } from 'zustand';
import { produce, type Draft } from 'immer';
import { pageAt } from '@/lib/album/ops';
import { buildSpreads, spreadIndexOfPage } from '@/lib/album/geometry';
import type { AlbumDocument, AlbumElement, Page, PageRef, PhotoAsset, PhotoMap } from '@/lib/album/types';

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';
export type PanelId = 'pages' | 'photos' | 'layouts' | 'text' | 'backgrounds' | 'elements';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

export interface Toast {
  id: number;
  message: string;
  tone?: 'info' | 'error' | 'success';
}

interface HistoryEntry {
  doc: AlbumDocument;
  key?: string;
  at: number;
}

export interface EditorState {
  projectId: string;
  title: string;
  status: string;
  doc: AlbumDocument;
  version: number;
  photos: PhotoAsset[];
  photoMap: PhotoMap;
  active: PageRef;
  selectedId: string | null;
  editingTextId: string | null;
  croppingId: string | null;
  viewMode: 'spread' | 'single';
  zoom: number;
  panel: PanelId | null;
  propsOpen: boolean;
  past: HistoryEntry[];
  future: AlbumDocument[];
  gesture: AlbumDocument | null;
  saveState: SaveState;
  savedAt: number | null;
  changeCounter: number;
  uploads: UploadItem[];
  toasts: Toast[];
  dragPhotoId: string | null;

  init: (p: { projectId: string; title: string; status: string; doc: AlbumDocument; version: number; photos: PhotoAsset[] }) => void;
  apply: (recipe: (draft: Draft<AlbumDocument>) => void, opts?: { key?: string; silent?: boolean }) => void;
  updateElement: (ref: PageRef, id: string, patch: Partial<AlbumElement> | ((el: Draft<AlbumElement>) => void), opts?: { key?: string }) => void;
  beginGesture: () => void;
  endGesture: () => void;
  undo: () => void;
  redo: () => void;
  setActive: (ref: PageRef, selectedId?: string | null) => void;
  select: (id: string | null, ref?: PageRef) => void;
  setEditingText: (id: string | null) => void;
  setCropping: (id: string | null) => void;
  setViewMode: (m: 'spread' | 'single') => void;
  setZoom: (z: number) => void;
  setPanel: (p: PanelId | null) => void;
  setPropsOpen: (o: boolean) => void;
  setTitle: (t: string) => void;
  addPhotos: (p: PhotoAsset[]) => void;
  removePhoto: (id: string) => void;
  setUploads: (fn: (u: UploadItem[]) => UploadItem[]) => void;
  markSaving: () => void;
  markSaved: (version: number, changeCounter: number) => void;
  markSaveError: (conflict?: boolean) => void;
  setVersion: (v: number) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
  setDragPhoto: (id: string | null) => void;
}

const HISTORY_LIMIT = 100;
const COALESCE_MS = 1200;
let toastSeq = 1;

const mapPhotos = (photos: PhotoAsset[]): PhotoMap => Object.fromEntries(photos.map((p) => [p.id, p]));

export const useEditor = create<EditorState>()((set, get) => ({
  projectId: '',
  title: '',
  status: 'draft',
  doc: null as unknown as AlbumDocument,
  version: 0,
  photos: [],
  photoMap: {},
  active: { kind: 'cover' },
  selectedId: null,
  editingTextId: null,
  croppingId: null,
  viewMode: 'spread',
  zoom: 1,
  panel: 'photos',
  propsOpen: false,
  past: [],
  future: [],
  gesture: null,
  saveState: 'saved',
  savedAt: null,
  changeCounter: 0,
  uploads: [],
  toasts: [],
  dragPhotoId: null,

  init: ({ projectId, title, status, doc, version, photos }) =>
    set({
      projectId,
      title,
      status,
      doc,
      version,
      photos,
      photoMap: mapPhotos(photos),
      active: { kind: 'cover' },
      selectedId: null,
      editingTextId: null,
      croppingId: null,
      past: [],
      future: [],
      gesture: null,
      saveState: 'saved',
      savedAt: Date.now(),
      changeCounter: 0,
      uploads: [],
      panel: photos.length ? 'photos' : 'photos',
    }),

  apply: (recipe, opts) => {
    const s = get();
    const next = produce(s.doc, recipe);
    if (next === s.doc) return;
    if (s.gesture) {
      set({ doc: next, changeCounter: s.changeCounter + 1, saveState: 'dirty' });
      return;
    }
    const now = Date.now();
    const last = s.past[s.past.length - 1];
    const coalesce = opts?.key && last?.key === opts.key && now - last.at < COALESCE_MS;
    const past = coalesce ? [...s.past.slice(0, -1), { ...last, at: now }] : [...s.past, { doc: s.doc, key: opts?.key, at: now }].slice(-HISTORY_LIMIT);
    set({ doc: next, past, future: [], changeCounter: s.changeCounter + 1, saveState: 'dirty' });
  },

  updateElement: (ref, id, patch, opts) =>
    get().apply((d) => {
      const page = pageAt(d as AlbumDocument, ref) as Draft<Page> | undefined;
      const el = page?.elements.find((e) => e.id === id);
      if (!el) return;
      if (typeof patch === 'function') patch(el);
      else Object.assign(el, patch);
    }, opts),

  beginGesture: () => {
    if (!get().gesture) set({ gesture: get().doc });
  },
  endGesture: () => {
    const s = get();
    if (!s.gesture) return;
    if (s.gesture !== s.doc) {
      set({ past: [...s.past, { doc: s.gesture, at: Date.now() }].slice(-HISTORY_LIMIT), future: [], gesture: null });
    } else set({ gesture: null });
  },

  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    set({
      doc: prev.doc,
      past: s.past.slice(0, -1),
      future: [s.doc, ...s.future],
      changeCounter: s.changeCounter + 1,
      saveState: 'dirty',
      editingTextId: null,
      croppingId: null,
      ...clampSelection(prev.doc, s.active, s.selectedId),
    });
  },
  redo: () => {
    const s = get();
    const next = s.future[0];
    if (!next) return;
    set({
      doc: next,
      future: s.future.slice(1),
      past: [...s.past, { doc: s.doc, at: Date.now() }],
      changeCounter: s.changeCounter + 1,
      saveState: 'dirty',
      editingTextId: null,
      croppingId: null,
      ...clampSelection(next, s.active, s.selectedId),
    });
  },

  setActive: (ref, selectedId = null) => set({ active: ref, selectedId, editingTextId: null, croppingId: null }),
  select: (id, ref) => set((s) => ({ selectedId: id, active: ref ?? s.active, editingTextId: s.editingTextId === id ? s.editingTextId : null, croppingId: s.croppingId === id ? s.croppingId : null, propsOpen: id ? s.propsOpen : s.propsOpen })),
  setEditingText: (id) => set({ editingTextId: id, croppingId: null }),
  setCropping: (id) => set({ croppingId: id, editingTextId: null }),
  setViewMode: (viewMode) => set({ viewMode }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
  setPanel: (panel) => set({ panel }),
  setPropsOpen: (propsOpen) => set({ propsOpen }),
  setTitle: (title) => set((s) => ({ title, changeCounter: s.changeCounter + 1, saveState: 'dirty' })),
  addPhotos: (p) => set((s) => {
    const photos = [...s.photos, ...p.filter((x) => !s.photoMap[x.id])];
    return { photos, photoMap: mapPhotos(photos) };
  }),
  removePhoto: (id) => set((s) => {
    const photos = s.photos.filter((p) => p.id !== id);
    return { photos, photoMap: mapPhotos(photos) };
  }),
  setUploads: (fn) => set((s) => ({ uploads: fn(s.uploads) })),
  markSaving: () => set({ saveState: 'saving' }),
  markSaved: (version, counter) =>
    set((s) => ({ version, savedAt: Date.now(), saveState: s.changeCounter === counter ? 'saved' : 'dirty' })),
  markSaveError: (conflict) => set({ saveState: conflict ? 'conflict' : 'error' }),
  setVersion: (version) => set({ version }),
  toast: (message, tone = 'info') => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), 4500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setDragPhoto: (dragPhotoId) => set({ dragPhotoId }),
}));

function clampSelection(doc: AlbumDocument, active: PageRef, selectedId: string | null) {
  let ref = active;
  if (ref.kind === 'page' && ref.index >= doc.pages.length) ref = { kind: 'page', index: doc.pages.length - 1 };
  const page = pageAt(doc, ref);
  return { active: ref, selectedId: page?.elements.some((e) => e.id === selectedId) ? selectedId : null };
}

/** The page refs visible on the canvas for the active page. */
export function visibleRefs(doc: AlbumDocument, active: PageRef, mode: 'spread' | 'single'): Array<PageRef | null> {
  if (active.kind !== 'page' || mode === 'single') return [active];
  const spread = buildSpreads(doc.pages.length)[spreadIndexOfPage(active.index)];
  if (!spread) return [active];
  return [spread.left !== null ? { kind: 'page', index: spread.left } : null, spread.right !== null ? { kind: 'page', index: spread.right } : null];
}

export function refLabel(ref: PageRef): string {
  return ref.kind === 'cover' ? 'Front cover' : ref.kind === 'back' ? 'Back cover' : `Page ${ref.index + 1}`;
}
