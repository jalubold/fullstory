'use client';

import { memo, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Files,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Paintbrush,
  Plus,
  Shapes,
  Trash2,
  Type,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { PageView } from '@/components/album/PageView';
import { applyLayout, buildPage, roleStyle } from '@/lib/album/build';
import { cssFontStack } from '@/lib/album/fonts';
import { buildSpreads, usedPhotoIds } from '@/lib/album/geometry';
import { LAYOUT_GROUPS, LAYOUTS } from '@/lib/album/layouts';
import { addOrnament, addPages, addPhotoFrame, addShape, addText, allPages, autofill, clearPhoto, deletePage, duplicatePage, movePage, pageAt } from '@/lib/album/ops';
import { ORNAMENT_LIST } from '@/lib/album/ornaments';
import type { BackgroundPattern, Page, PageSize, PhotoAsset, PhotoElement, TextRole, Theme } from '@/lib/album/types';
import { PHOTO_MIME } from './EditablePage';
import { refLabel, useEditor, type PanelId } from './store';
import { uploadFiles } from './uploads';

const TABS: Array<{ id: PanelId; label: string; icon: typeof Files }> = [
  { id: 'pages', label: 'Pages', icon: Files },
  { id: 'photos', label: 'Photos', icon: ImageIcon },
  { id: 'layouts', label: 'Layouts', icon: LayoutTemplate },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'backgrounds', label: 'Backgrounds', icon: Paintbrush },
  { id: 'elements', label: 'Elements', icon: Shapes },
];

export function EditorSidebar() {
  const panel = useEditor((s) => s.panel);
  const setPanel = useEditor((s) => s.setPanel);
  return (
    <div className="flex h-full shrink-0">
      <nav aria-label="Editor tools" className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-line bg-white py-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanel(panel === id ? null : id)}
            aria-pressed={panel === id}
            className={`flex w-[60px] flex-col items-center gap-1 rounded-xl py-2.5 text-[10.5px] transition ${panel === id ? 'bg-accent-soft text-ink' : 'text-muted hover:bg-paper hover:text-ink'}`}
          >
            <Icon size={19} strokeWidth={1.6} />
            {label}
          </button>
        ))}
      </nav>
      {panel && (
        <div className="absolute inset-y-0 left-[72px] z-30 w-[300px] overflow-y-auto border-r border-line bg-white shadow-pop scrollbar-thin lg:static lg:shadow-none">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-5 py-3.5 backdrop-blur">
            <p className="font-serif text-xl">{TABS.find((t) => t.id === panel)?.label}</p>
            <button type="button" className="btn btn-ghost btn-sm !p-1.5 lg:hidden" onClick={() => setPanel(null)} aria-label="Close panel">
              <X size={16} />
            </button>
          </div>
          <div className="p-5">
            {panel === 'pages' && <PagesPanel />}
            {panel === 'photos' && <PhotosPanel />}
            {panel === 'layouts' && <LayoutsPanel />}
            {panel === 'text' && <TextPanel />}
            {panel === 'backgrounds' && <BackgroundsPanel />}
            {panel === 'elements' && <ElementsPanel />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- pages --------------------------------- */

function PagesPanel() {
  const doc = useEditor((s) => s.doc);
  const photos = useEditor((s) => s.photoMap);
  const active = useEditor((s) => s.active);
  const { apply, setActive, toast } = useEditor.getState();
  const spreads = buildSpreads(doc.pages.length);
  const idx = active.kind === 'page' ? active.index : -1;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-paper p-4 text-sm">
        <p className="font-medium">{doc.size.label} · {doc.orientation[0].toUpperCase() + doc.orientation.slice(1)}</p>
        <p className="mt-0.5 text-muted">{doc.pages.length} pages + cover</p>
        {doc.pages.length % 2 === 1 && <p className="mt-2 text-xs text-warning">Printed books need an even number of pages — a blank page will be added at the end when printing.</p>}
      </div>

      {idx >= 0 && (
        <div>
          <p className="eyebrow mb-2">Page {idx + 1}</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { let n = 0; apply((d) => { n = duplicatePage(d, idx); }); setActive({ kind: 'page', index: n }); }}>
              <Copy size={14} /> Duplicate
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={doc.pages.length <= 1}
              onClick={() => {
                apply((d) => void deletePage(d, idx));
                setActive({ kind: 'page', index: Math.max(0, idx - 1) });
                toast('Page deleted — press Undo to restore it');
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={idx === 0} onClick={() => { apply((d) => movePage(d, idx, idx - 1)); setActive({ kind: 'page', index: idx - 1 }); }}>
              <ArrowLeft size={14} /> Move
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={idx >= doc.pages.length - 1} onClick={() => { apply((d) => movePage(d, idx, idx + 1)); setActive({ kind: 'page', index: idx + 1 }); }}>
              Move <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
      <button type="button" className="btn btn-primary btn-sm w-full" onClick={() => { let n = 0; apply((d) => { n = addPages(d, idx >= 0 ? idx : d.pages.length - 1, 2); }); setActive({ kind: 'page', index: n }); }}>
        <Plus size={14} /> Add two pages
      </button>

      <div>
        <label className="label" htmlFor="spine">Spine text (hardcover)</label>
        <input id="spine" className="input input-sm" value={doc.spineText} maxLength={60} onChange={(e) => apply((d) => { d.spineText = e.target.value; }, { key: 'spine' })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PageTile label="Cover" page={doc.cover} size={doc.size} photos={photos} active={active.kind === 'cover'} onClick={() => setActive({ kind: 'cover' })} />
        <PageTile label="Back cover" page={doc.backCover} size={doc.size} photos={photos} active={active.kind === 'back'} onClick={() => setActive({ kind: 'back' })} />
        {spreads.map((s, i) => (
          <div key={i} className="col-span-2 grid grid-cols-2 gap-0">
            {[s.left, s.right].map((p, k) =>
              p === null ? (
                <div key={k} className="bg-paper" />
              ) : (
                <PageTile key={k} label={`${p + 1}`} page={doc.pages[p]} size={doc.size} photos={photos} active={idx === p} onClick={() => setActive({ kind: 'page', index: p })} />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const PageTile = memo(function PageTile({ label, page, size, photos, active, onClick }: { label: string; page: Page; size: PageSize; photos: Record<string, PhotoAsset>; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block text-left">
      <span className={`block overflow-hidden ${active ? 'ring-2 ring-accent' : 'ring-1 ring-line'}`}>
        <PageView page={page} size={size} photos={photos} renderWidth={130} />
      </span>
      <span className="mt-1 block text-[11px] text-muted">{label}</span>
    </button>
  );
});

/* --------------------------------- photos --------------------------------- */

function PhotosPanel() {
  const photos = useEditor((s) => s.photos);
  const doc = useEditor((s) => s.doc);
  const uploads = useEditor((s) => s.uploads);
  const [filter, setFilter] = useState<'all' | 'unused'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const used = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { page } of allPages(doc)) for (const el of page.elements) if (el.type === 'photo' && el.photoId) counts.set(el.photoId, (counts.get(el.photoId) ?? 0) + 1);
    return counts;
  }, [doc]);
  const list = filter === 'unused' ? photos.filter((p) => !used.has(p.id)) : photos;
  const emptyFrames = useMemo(() => allPages(doc).reduce((n, { page }) => n + page.elements.filter((e) => e.type === 'photo' && !e.photoId).length, 0), [doc]);

  const place = (photo: PhotoAsset) => {
    const s = useEditor.getState();
    const page = pageAt(s.doc, s.active);
    const sel = page?.elements.find((e) => e.id === s.selectedId);
    if (sel?.type === 'photo') {
      s.updateElement(s.active, sel.id, (d) => {
        const p = d as PhotoElement;
        p.photoId = photo.id;
        p.crop = { zoom: 1, fx: 0.5, fy: 0.5 };
      });
      return;
    }
    const empty = page?.elements.find((e) => e.type === 'photo' && !e.photoId);
    if (empty) {
      s.updateElement(s.active, empty.id, { photoId: photo.id } as Partial<PhotoElement>);
      s.select(empty.id);
      return;
    }
    let id = '';
    s.apply((d) => {
      const pg = pageAt(d, s.active);
      if (pg) id = addPhotoFrame(d, pg, photo).id;
    });
    s.select(id);
  };

  const remove = async (photo: PhotoAsset) => {
    if (used.has(photo.id) && !window.confirm('This photo is used in your album. Remove it from the album and delete it?')) return;
    setBusy(photo.id);
    const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
    setBusy(null);
    const s = useEditor.getState();
    if (!res.ok) return s.toast('Couldn’t delete that photo. Please try again.', 'error');
    if (used.has(photo.id)) s.apply((d) => clearPhoto(d, photo.id));
    s.removePhoto(photo.id);
  };

  return (
    <div className="space-y-5">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { if (e.target.files?.length) void uploadFiles([...e.target.files]); e.target.value = ''; }} />
      <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong bg-paper px-4 py-6 text-center transition hover:border-accent hover:bg-accent-soft/40">
        <Upload size={20} className="text-accent-dark" />
        <span className="text-sm font-medium">Upload photos</span>
        <span className="text-xs text-muted">or drag files anywhere · JPEG, PNG, WebP</span>
      </button>

      {uploads.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.id} className="text-xs">
              <div className="flex justify-between gap-2">
                <span className="truncate">{u.name}</span>
                <span className={u.status === 'error' ? 'text-danger' : 'text-muted'}>{u.status === 'error' ? 'Failed' : u.status === 'done' ? 'Done' : `${Math.round(u.progress * 100)}%`}</span>
              </div>
              {u.status === 'error' ? <p className="mt-0.5 text-danger">{u.error}</p> : <div className="mt-1 h-1 overflow-hidden rounded-full bg-paper-2"><div className="h-full bg-accent transition-all" style={{ width: `${u.progress * 100}%` }} /></div>}
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <>
          {emptyFrames > 0 && (
            <button type="button" className="btn btn-secondary btn-sm w-full" onClick={() => { const s = useEditor.getState(); let n = 0; s.apply((d) => { n = autofill(d, s.photos); }); s.toast(n ? `Filled ${n} empty ${n === 1 ? 'frame' : 'frames'}` : 'No unused photos left to place'); }}>
              <Wand2 size={14} /> Auto-fill {emptyFrames} empty {emptyFrames === 1 ? 'frame' : 'frames'}
            </button>
          )}
          <div className="flex items-center justify-between">
            <div className="flex rounded-full bg-paper p-0.5 text-xs">
              {(['all', 'unused'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 ${filter === f ? 'bg-white shadow-sm' : 'text-muted'}`}>
                  {f === 'all' ? `All (${photos.length})` : `Unused (${photos.filter((p) => !used.has(p.id)).length})`}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted">Drag a photo onto a frame, or click to place it in the selected frame.</p>
          <div className="grid grid-cols-3 gap-2">
            {list.map((p) => (
              <div key={p.id} className="group relative">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(PHOTO_MIME, p.id);
                    e.dataTransfer.effectAllowed = 'copy';
                    useEditor.getState().setDragPhoto(p.id);
                  }}
                  onDragEnd={() => useEditor.getState().setDragPhoto(null)}
                  onClick={() => place(p)}
                  className="block aspect-square w-full overflow-hidden rounded-lg bg-paper-2"
                  title={p.alt}
                >
                  <img src={p.thumbUrl} alt={p.alt ?? ''} loading="lazy" className="h-full w-full object-cover" draggable={false} />
                </button>
                {used.has(p.id) && <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-ink/75 px-1.5 text-[10px] text-paper">✓ {used.get(p.id)}</span>}
                <button type="button" onClick={() => remove(p)} aria-label="Delete photo" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100">
                  {busy === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {photos.length === 0 && uploads.length === 0 && <p className="text-center text-sm text-muted">No photos yet. Upload a few to start filling your album.</p>}
    </div>
  );
}

/* --------------------------------- layouts -------------------------------- */

const LayoutThumb = memo(function LayoutThumb({ id, theme, size }: { id: string; theme: Theme; size: PageSize }) {
  const page = useMemo(() => buildPage(id, theme, size), [id, theme, size]);
  return <PageView page={page} size={size} photos={{}} renderWidth={120} emptyFrames="placeholder" />;
});

function LayoutsPanel() {
  const doc = useEditor((s) => s.doc);
  const active = useEditor((s) => s.active);
  const current = pageAt(doc, active);
  const groups = LAYOUT_GROUPS.filter((g) => (active.kind === 'cover' ? g.id === 'cover' : active.kind === 'back' ? g.id === 'back' || g.id === 'single' : g.id !== 'cover' && g.id !== 'back'));
  const applyIt = (id: string) => {
    const s = useEditor.getState();
    let displaced: string[] = [];
    s.apply((d) => {
      const pg = pageAt(d, s.active);
      if (!pg) return;
      const res = applyLayout(pg as Page, id, d.theme, d.size);
      displaced = res.displaced;
      Object.assign(pg, res.page);
    });
    s.select(null);
    if (displaced.length) s.toast(`${displaced.length} ${displaced.length === 1 ? 'photo' : 'photos'} didn’t fit this layout — still in your Photos panel.`);
  };
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">Applying a layout to {refLabel(active).toLowerCase()} keeps your photos and text wherever possible.</p>
      {groups.map((g) => (
        <div key={g.id}>
          <p className="eyebrow mb-3">{g.label}</p>
          <div className="grid grid-cols-2 gap-3">
            {LAYOUTS.filter((l) => l.group === g.id).map((l) => (
              <button key={l.id} type="button" onClick={() => applyIt(l.id)} className="group text-left" title={l.name}>
                <span className={`block overflow-hidden transition ${current?.layoutId === l.id ? 'ring-2 ring-accent' : 'ring-1 ring-line group-hover:ring-ink/40'}`}>
                  <LayoutThumb id={l.id} theme={doc.theme} size={doc.size} />
                </span>
                <span className="mt-1 block truncate text-[11px] text-muted">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- text ---------------------------------- */

function TextPanel() {
  const doc = useEditor((s) => s.doc);
  const presets: Array<{ role: TextRole; label: string }> = [
    { role: 'title', label: 'Add a title' },
    { role: 'heading', label: 'Add a heading' },
    { role: 'subtitle', label: 'Add a subtitle' },
    { role: 'body', label: 'Add body text' },
    { role: 'caption', label: 'Add a caption' },
    { role: 'label', label: 'Add a label' },
  ];
  const add = (role: TextRole) => {
    const s = useEditor.getState();
    let id = '';
    s.apply((d) => {
      const pg = pageAt(d, s.active);
      if (pg) id = addText(d, pg, role).id;
    });
    s.select(id);
    s.setEditingText(id);
  };
  return (
    <div className="space-y-2.5">
      <p className="mb-3 text-xs text-muted">Text styles follow your album’s design. Double-click any text on the page to edit it.</p>
      {presets.map(({ role, label }) => {
        const st = roleStyle(doc.theme, role, { widthMm: 203.2, heightMm: 203.2 });
        const px = Math.min(30, Math.max(12, st.size * 0.9));
        return (
          <button
            key={role}
            type="button"
            onClick={() => add(role)}
            className="block w-full truncate rounded-xl border border-line bg-paper px-4 py-3 text-left transition hover:border-ink/40"
            style={{ fontFamily: cssFontStack(st.font), fontWeight: st.weight, fontStyle: st.italic ? 'italic' : 'normal', fontSize: px, letterSpacing: `${st.letterSpacing}em`, textTransform: st.uppercase ? 'uppercase' : undefined, color: '#25231F' }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- backgrounds ------------------------------ */

const NEUTRALS = ['#FFFFFF', '#FBFAF7', '#F5F0E8', '#EFE6DA', '#E8DCC6', '#DCE3DA', '#E4EEF0', '#F8EEEA', '#C9B8A6', '#2B2E2A', '#1E2B24', '#161513', '#1F2A44'];
const PATTERNS: Array<{ id: BackgroundPattern; label: string }> = [
  { id: 'none', label: 'Plain' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'lines', label: 'Lined' },
  { id: 'frame', label: 'Frame' },
  { id: 'double-frame', label: 'Double frame' },
  { id: 'corners', label: 'Corners' },
];

export function ColorSwatches({ value, onChange, colors }: { value: string | null; onChange: (c: string) => void; colors: string[] }) {
  const uniq = [...new Set(colors.map((c) => c.toUpperCase()))];
  return (
    <div className="flex flex-wrap gap-2">
      {uniq.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} aria-label={`Colour ${c}`} aria-pressed={value?.toUpperCase() === c} className={`h-7 w-7 rounded-full border transition ${value?.toUpperCase() === c ? 'ring-2 ring-accent ring-offset-2' : 'border-black/10 hover:scale-110'}`} style={{ background: c }} />
      ))}
      <label className="relative grid h-7 w-7 cursor-pointer place-items-center overflow-hidden rounded-full border border-black/10 bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]" title="Custom colour">
        <input type="color" value={value ?? '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
    </div>
  );
}

function BackgroundsPanel() {
  const doc = useEditor((s) => s.doc);
  const active = useEditor((s) => s.active);
  const page = pageAt(doc, active);
  if (!page) return null;
  const bg = page.background;
  const set = (patch: Partial<Page['background']>) => {
    const s = useEditor.getState();
    s.apply((d) => {
      const pg = pageAt(d, s.active);
      if (pg) Object.assign(pg.background, patch);
    }, { key: `bg:${page.id}` });
  };
  return (
    <div className="space-y-7">
      <div>
        <p className="eyebrow mb-3">Colour · {refLabel(active)}</p>
        <ColorSwatches value={bg.color} onChange={(c) => set({ color: c })} colors={[...doc.theme.palette, ...NEUTRALS]} />
      </div>
      <div>
        <p className="eyebrow mb-3">Style</p>
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => (
            <button key={p.id} type="button" onClick={() => set({ pattern: p.id })} className={`overflow-hidden rounded-lg text-left ${bg.pattern === p.id ? 'ring-2 ring-accent' : 'ring-1 ring-line hover:ring-ink/40'}`}>
              <PageView page={{ id: p.id, layoutId: null, background: { ...bg, pattern: p.id }, elements: [] }} size={{ widthMm: 100, heightMm: 70 }} photos={{}} renderWidth={80} />
              <span className="block px-1.5 py-1 text-[10px] text-muted">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      {bg.pattern !== 'none' && (
        <div>
          <p className="eyebrow mb-3">Pattern colour</p>
          <ColorSwatches value={bg.patternColor} onChange={(c) => set({ patternColor: c })} colors={[doc.theme.colors.accent, doc.theme.colors.muted, doc.theme.colors.text, '#FFFFFF', '#B9A585', '#C9D3D6']} />
        </div>
      )}
      <button
        type="button"
        className="btn btn-secondary btn-sm w-full"
        onClick={() => {
          const s = useEditor.getState();
          s.apply((d) => {
            for (const p of d.pages) p.background = { ...bg };
          });
          s.toast('Background applied to all interior pages');
        }}
      >
        Apply to all pages
      </button>
    </div>
  );
}

/* -------------------------------- elements -------------------------------- */

function ElementsPanel() {
  const doc = useEditor((s) => s.doc);
  const add = (fn: (d: Parameters<Parameters<ReturnType<typeof useEditor.getState>['apply']>[0]>[0], pg: Page) => { id: string }) => {
    const s = useEditor.getState();
    let id = '';
    s.apply((d) => {
      const pg = pageAt(d, s.active);
      if (pg) id = fn(d, pg as Page).id;
    });
    s.select(id);
  };
  return (
    <div className="space-y-7">
      <div>
        <p className="eyebrow mb-3">Frames & shapes</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => add((d, pg) => addPhotoFrame(d, pg))}>
            <ImageIcon size={14} /> Photo frame
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => add((d, pg) => addShape(d, pg, 'rect'))}>
            <span className="h-3 w-3.5 rounded-[2px] bg-accent" /> Rectangle
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => add((d, pg) => addShape(d, pg, 'ellipse'))}>
            <span className="h-3.5 w-3.5 rounded-full bg-accent" /> Circle
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => add((d, pg) => addShape(d, pg, 'line'))}>
            <span className="h-px w-4 bg-accent" /> Line
          </button>
        </div>
      </div>
      <div>
        <p className="eyebrow mb-3">Decorations</p>
        <div className="grid grid-cols-4 gap-2">
          {ORNAMENT_LIST.map((o) => (
            <button key={o.id} type="button" title={o.label} onClick={() => add((d, pg) => addOrnament(d, pg, o.id))} className="grid aspect-square place-items-center rounded-lg bg-paper p-2.5 transition hover:bg-accent-soft">
              <svg viewBox={`0 0 ${o.viewBox[0]} ${o.viewBox[1]}`} className="h-full w-full" aria-hidden>
                {o.paths.map((p, i) =>
                  p.mode === 'fill' ? <path key={i} d={p.d} fill={doc.theme.colors.accent} opacity={p.opacity} /> : <path key={i} d={p.d} fill="none" stroke={doc.theme.colors.accent} strokeWidth={p.strokeWidth} strokeLinecap="round" />,
                )}
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { usedPhotoIds };
