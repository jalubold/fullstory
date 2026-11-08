'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type DragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, Check, ChevronLeft, ChevronRight, CloudOff, Eye, ImagePlus, Loader2, Minus, Move, Music2, Plus, Redo2, RotateCcw, Trash2, Undo2, Upload, Wand2, X } from 'lucide-react';
import { PageView } from '@/components/album/PageView';
import { bookFinish, luminance } from '@/lib/album/color';
import { cssFontStack } from '@/lib/album/fonts';
import { buildSpreads, computeCrop, effectiveDpi, pageSizePt, panCrop } from '@/lib/album/geometry';
import { allPages, autofill, clearPhoto, findElement, pageAt } from '@/lib/album/ops';
import type { AlbumDocument, AlbumElement, Crop, Page, PageRef, PageSize, PhotoAsset, PhotoElement, PhotoMap, TextElement } from '@/lib/album/types';
import { MotionPanel } from '../MotionPanel';
import { useEditor } from '../store';
import { uploadFiles } from '../uploads';
import { UploadStatus, usePendingUploads, useUploadStats } from '../UploadStatus';

/**
 * The album editor, deliberately simple on every screen: nothing on a page
 * can be moved or resized. You add photos (they fill the frames), tap or click
 * a photo to change it, tap or click text to rewrite it, and choose the music
 * and page-turn style. Everything else is already designed.
 *
 *  - phones: one page at a time, swipe, bottom sheets
 *  - tablets/desktop: book spreads, centred dialogs, ←/→ to turn pages
 *  - desktop: a photo library alongside, drag photos (or files) onto frames
 */

type Target = { ref: PageRef; id: string };
type SheetState = { kind: 'photo'; target: Target | null } | { kind: 'text'; target: Target } | { kind: 'motion' } | null;
type Slide = { refs: Array<PageRef | null>; label: string; short: string };

const ACCEPT = 'image/jpeg,image/png,image/webp';
const PHOTO_MIME = 'application/x-fs-photo';
const TIP_KEY = 'fs:simple-tip:v1';
const pct = (n: number) => `${n * 100}%`;

/* ------------------------------- media queries ------------------------------- */

function mediaHook(query: string) {
  const subscribe = (cb: () => void) => {
    const m = window.matchMedia(query);
    m.addEventListener('change', cb);
    return () => m.removeEventListener('change', cb);
  };
  const get = () => window.matchMedia(query).matches;
  return () => useSyncExternalStore(subscribe, get, () => false);
}
/** Book spreads and centred dialogs (tablets and up; phones held sideways stay single-page). */
const useWide = mediaHook('(min-width: 768px) and (min-height: 501px)');
/** A photo library alongside the pages. */
const useDesk = mediaHook('(min-width: 1024px) and (min-height: 501px)');

/* ---------------------------------- helpers ---------------------------------- */

function slidesFor(pageCount: number, wide: boolean): Slide[] {
  const out: Slide[] = [{ refs: [{ kind: 'cover' }], label: 'Cover', short: 'Cover' }];
  if (!wide) {
    for (let i = 0; i < pageCount; i++) out.push({ refs: [{ kind: 'page', index: i }], label: `Page ${i + 1} of ${pageCount}`, short: String(i + 1) });
  } else {
    for (const s of buildSpreads(pageCount)) {
      const l = s.left !== null ? ({ kind: 'page', index: s.left } as const) : null;
      const r = s.right !== null ? ({ kind: 'page', index: s.right } as const) : null;
      const both = s.left !== null && s.right !== null;
      const one = (s.left ?? s.right)! + 1;
      out.push({ refs: [l, r], label: both ? `Pages ${s.left! + 1}–${s.right! + 1}` : `Page ${one}`, short: both ? `${s.left! + 1}–${s.right! + 1}` : String(one) });
    }
  }
  out.push({ refs: [{ kind: 'back' }], label: 'Back cover', short: 'Back' });
  return out;
}

const sameRef = (a: PageRef | null, b: PageRef) => !!a && a.kind === b.kind && (a.kind !== 'page' || (b.kind === 'page' && a.index === b.index));

function usedPhotoIds(doc: AlbumDocument) {
  const used = new Set<string>();
  for (const { page } of allPages(doc)) for (const el of page.elements) if (el.type === 'photo' && el.photoId) used.add(el.photoId);
  return used;
}

function emptyFrameCount(doc: AlbumDocument) {
  let n = 0;
  for (const { page } of allPages(doc)) for (const el of page.elements) if (el.type === 'photo' && !el.photoId) n++;
  return n;
}

function assignPhoto(target: Target, photoId: string) {
  useEditor.getState().updateElement(target.ref, target.id, (d) => {
    const p = d as PhotoElement;
    p.photoId = photoId;
    p.crop = { zoom: 1, fx: 0.5, fy: 0.5 };
  });
}

/** Uploads files; with a target frame the first photo goes there and the rest fill empty frames. */
function uploadInto(target: Target | null, files: File[]) {
  if (!files.length) return;
  let first = !!target;
  void uploadFiles(files, {
    autoPlace: !target,
    onShow: (batch) => {
      if (!target) return;
      let rest = batch;
      if (first && batch.length) {
        first = false;
        assignPhoto(target, batch[0].id);
        rest = batch.slice(1);
      }
      if (rest.length) useEditor.getState().apply((d) => void autofill(d as AlbumDocument, rest));
    },
  });
}

/** Puts a photo into the first empty frame on the pages in view. */
function placeOnSpread(refs: Array<PageRef | null>, photo: PhotoAsset) {
  const s = useEditor.getState();
  for (const ref of refs) {
    if (!ref) continue;
    const empty = pageAt(s.doc!, ref)?.elements.find((e) => e.type === 'photo' && !e.photoId);
    if (empty) {
      assignPhoto({ ref, id: empty.id }, photo.id);
      s.toast('Photo added to this page', 'success');
      return true;
    }
  }
  return false;
}

/** Height the on-screen keyboard takes from the bottom of the layout viewport. */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    on();
    vv.addEventListener('resize', on);
    vv.addEventListener('scroll', on);
    return () => {
      vv.removeEventListener('resize', on);
      vv.removeEventListener('scroll', on);
    };
  }, []);
  return inset;
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
};

/* ---------------------------------- editor ---------------------------------- */

export function SimpleEditor({ save, banners, minDpi }: { save: () => Promise<boolean>; banners?: ReactNode; minDpi: number }) {
  const router = useRouter();
  const wide = useWide();
  const desk = useDesk();
  const doc = useEditor((s) => s.doc)!;
  const photoMap = useEditor((s) => s.photoMap);
  const photoCount = useEditor((s) => s.photos.length);
  const toasts = useEditor((s) => s.toasts);
  const pageCount = doc.pages.length;
  const slides = useMemo(() => slidesFor(pageCount, wide), [pageCount, wide]);
  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [fileDrag, setFileDrag] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 360, h: 480 });
  const raf = useRef(0);
  const finish = useMemo(() => bookFinish(doc), [doc]);
  const at = Math.min(index, slides.length - 1);

  // Size pages to the space available, whatever the screen.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Switching between single pages and spreads (rotating a tablet, resizing a window): stay on the same page.
  useEffect(() => {
    const active = useEditor.getState().active;
    const i = Math.max(0, slides.findIndex((s) => s.refs.some((r) => sameRef(r, active))));
    const el = scroller.current;
    if (el) el.scrollLeft = i * el.clientWidth;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide]);

  useEffect(() => {
    const ref = slides[at]?.refs.find(Boolean);
    if (ref) useEditor.getState().setActive(ref);
  }, [at, slides]);

  const ratio = doc.size.widthMm / doc.size.heightMm;
  const pageW = Math.max(120, Math.floor(wide ? Math.min((box.w - 136) / 2, (box.h - 64) * ratio) : Math.min(box.w - 40, (box.h - 56) * ratio)));

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = scroller.current;
      if (el && el.clientWidth) setIndex(Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / el.clientWidth))));
    });
  };
  const goTo = (i: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * el.clientWidth, behavior: 'smooth' });
  };

  // ←/→ turn pages on a keyboard.
  const count = slides.length;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      const el = scroller.current;
      if (!step || !el) return;
      e.preventDefault();
      el.scrollTo({ left: Math.max(0, Math.min(count - 1, index + step)) * el.clientWidth, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, sheet, count]);

  const go = async (href: string) => {
    setLeaving(href);
    await save();
    router.push(href);
  };
  const projectId = useEditor.getState().projectId;

  const onPhoto = (ref: PageRef, id: string) => setSheet({ kind: 'photo', target: { ref, id } });
  const onText = (ref: PageRef, id: string) => setSheet({ kind: 'text', target: { ref, id } });

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-editor text-ink"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          if (!fileDrag) setFileDrag(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.relatedTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setFileDrag(false);
      }}
      onDrop={(e) => {
        setFileDrag(false);
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        uploadInto(null, [...e.dataTransfer.files]);
      }}
    >
      <TopBar wide={wide} onMotion={() => setSheet({ kind: 'motion' })} onPreview={() => go(`/projects/${projectId}/preview`)} onNext={() => go(`/projects/${projectId}/checkout`)} leaving={leaving} />
      {banners}

      <div className="flex min-h-0 flex-1">
        {desk && <LibraryPanel refs={slides[at]?.refs ?? []} />}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain" aria-roledescription="carousel" aria-label="Album pages">
              {slides.map((slide, i) => {
                const near = Math.abs(i - at) <= (wide ? 1 : 2);
                const spread = slide.refs.length === 2;
                return (
                  <section key={`${wide ? 's' : 'p'}-${i}`} aria-label={slide.label} className="flex h-full w-full shrink-0 snap-center snap-always flex-col items-center justify-center px-5 md:px-16">
                    <div className="relative flex shadow-[0_2px_6px_rgb(19_12_13/.08),0_26px_50px_-20px_rgb(19_12_13/.45)]">
                      {slide.refs.map((ref, k) =>
                        ref ? (
                          <div key={k} style={{ width: pageW }} className={`overflow-hidden bg-white ${ref.kind === 'page' ? 'rounded-[2px]' : 'rounded-[3px]'}`}>
                            {near ? (
                              <TapPage page={pageAt(doc, ref)!} pageRef={ref} size={doc.size} photos={photoMap} width={pageW} minDpi={minDpi} onPhoto={onPhoto} onText={onText} />
                            ) : (
                              <div style={{ aspectRatio: `${doc.size.widthMm} / ${doc.size.heightMm}`, background: pageAt(doc, ref)!.background.color }} />
                            )}
                          </div>
                        ) : (
                          <div key={k} aria-hidden style={{ width: pageW, aspectRatio: `${doc.size.widthMm} / ${doc.size.heightMm}`, background: finish.endpaper }} />
                        ),
                      )}
                      {spread && <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-12 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgb(0_0_0/.06)_40%,rgb(0_0_0/.16)_50%,rgb(0_0_0/.06)_60%,transparent)]" />}
                    </div>
                    <p className="smallcaps mt-4">{slide.label}</p>
                  </section>
                );
              })}
            </div>
            {at > 0 && (
              <button type="button" onClick={() => goTo(at - 1)} aria-label="Previous page" className="absolute left-1 top-1/2 grid h-10 w-8 -translate-y-1/2 place-items-center text-ink/50 transition active:text-ink md:left-4 md:h-11 md:w-11 md:rounded-full md:border md:border-line md:bg-card md:text-ink-soft md:shadow-sm md:hover:text-ink">
                <ChevronLeft size={22} />
              </button>
            )}
            {at < slides.length - 1 && (
              <button type="button" onClick={() => goTo(at + 1)} aria-label="Next page" className="absolute right-1 top-1/2 grid h-10 w-8 -translate-y-1/2 place-items-center text-ink/50 transition active:text-ink md:right-4 md:h-11 md:w-11 md:rounded-full md:border md:border-line md:bg-card md:text-ink-soft md:shadow-sm md:hover:text-ink">
                <ChevronRight size={22} />
              </button>
            )}
            <FirstTimeTip wide={wide} />
            <div className="pointer-events-none absolute inset-x-0 top-3 z-40 flex flex-col items-center gap-2 px-4">
              {toasts.map((t) => (
                <div key={t.id} role="status" className={`pointer-events-auto max-w-full rounded-full px-4 py-2 text-center text-[13px] shadow-pop animate-fade-up ${t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-paper'}`}>
                  {wide ? t.message : t.message.replace(' · ⌘Z to undo', '')}
                </div>
              ))}
            </div>
          </div>

          <BottomBar index={at} slides={slides} doc={doc} photos={photoMap} photoCount={photoCount} showActions={!desk} onPick={goTo} onLibrary={() => setSheet({ kind: 'photo', target: null })} />
        </div>
      </div>

      {sheet?.kind === 'photo' && <PhotoSheet target={sheet.target} refs={slides[at]?.refs ?? []} minDpi={minDpi} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'text' && <TextSheet target={sheet.target} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'motion' && (
        <Sheet title="Music & page turns" onClose={() => setSheet(null)}>
          <div className="pt-1">
            <MotionPanel />
          </div>
        </Sheet>
      )}

      {fileDrag && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-ink/25">
          <div className="flex flex-col items-center gap-2 rounded-[4px] border border-line-strong bg-card px-10 py-7 text-center shadow-pop">
            <ImagePlus size={26} className="text-accent" strokeWidth={1.5} />
            <p className="font-serif text-2xl">Drop to add your photos</p>
            <p className="text-xs text-muted">Drop on a photo to replace it, anywhere else to fill empty frames.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- top bar ---------------------------------- */

function TopBar({ wide, onMotion, onPreview, onNext, leaving }: { wide: boolean; onMotion: () => void; onPreview: () => void; onNext: () => void; leaving: string | null }) {
  const title = useEditor((s) => s.title);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const state = useEditor((s) => s.saveState);
  const status = {
    saved: { icon: <Check size={11} />, text: 'Saved', cls: 'text-muted' },
    dirty: { icon: <span className="h-1.5 w-1.5 rounded-full bg-warning" />, text: 'Saving soon', cls: 'text-muted' },
    saving: { icon: <Loader2 size={11} className="animate-spin" />, text: 'Saving…', cls: 'text-muted' },
    error: { icon: <CloudOff size={11} />, text: 'Offline — kept on this device', cls: 'text-warning' },
    conflict: { icon: <AlertCircle size={11} />, text: 'Changed elsewhere', cls: 'text-danger' },
  }[state];
  const icon = 'grid h-11 w-10 shrink-0 place-items-center text-ink-soft transition hover:text-ink disabled:opacity-30';
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-card pl-1 pr-2 md:h-16 md:gap-2 md:px-4">
      <Link href="/dashboard" aria-label="All albums" className="grid h-11 w-10 shrink-0 place-items-center text-ink-soft hover:text-ink">
        <ChevronLeft size={22} />
      </Link>
      <div className="min-w-0 flex-1">
        <input
          value={title}
          onChange={(e) => useEditor.getState().setTitle(e.target.value.slice(0, 120))}
          aria-label="Album name"
          className="block w-full max-w-sm truncate rounded-[3px] border border-transparent bg-transparent px-1 py-0 font-serif text-[1.15rem] leading-tight hover:border-line focus:border-accent focus:outline-none md:text-xl"
        />
        <p className={`flex items-center gap-1 px-1 text-[11px] leading-tight ${status.cls}`} aria-live="polite">
          {status.icon} {status.text}
        </p>
      </div>
      <button type="button" onClick={() => useEditor.getState().undo()} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl/⌘ Z)" className={icon}>
        <Undo2 size={19} />
      </button>
      {wide && (
        <button type="button" onClick={() => useEditor.getState().redo()} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl/⌘ Shift Z)" className={icon}>
          <Redo2 size={19} />
        </button>
      )}
      {wide && <span aria-hidden className="mx-1 h-6 w-px bg-line" />}
      <button type="button" onClick={onMotion} aria-label="Music and page turns" title="Music & page turns" className={wide ? 'btn btn-ghost btn-sm shrink-0' : icon}>
        <Music2 size={wide ? 16 : 19} /> {wide && 'Music & motion'}
      </button>
      <button type="button" onClick={onPreview} aria-label="Preview" title="Preview" className={wide ? 'btn btn-secondary btn-sm shrink-0' : icon}>
        {leaving?.endsWith('/preview') ? <Loader2 size={wide ? 15 : 19} className="animate-spin" /> : <Eye size={wide ? 15 : 19} />} {wide && 'Preview'}
      </button>
      <button type="button" onClick={onNext} className="btn btn-primary btn-sm ml-1 shrink-0 !px-3.5 text-[0.6875rem] uppercase tracking-[0.16em] md:!px-5">
        {wide ? 'Continue' : 'Next'} {leaving?.endsWith('/checkout') ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
      </button>
    </header>
  );
}

/* --------------------------------- the page --------------------------------- */

const box = (el: AlbumElement): CSSProperties => ({
  left: pct(el.x),
  top: pct(el.y),
  width: pct(el.w),
  height: pct(el.h),
  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
});

const accepts = (e: DragEvent) => e.dataTransfer.types.includes(PHOTO_MIME) || e.dataTransfer.types.includes('Files');

/** A rendered page with targets over its photos and text. Nothing here can be dragged around. */
const TapPage = memo(function TapPage({
  page,
  pageRef,
  size,
  photos,
  width,
  minDpi,
  onPhoto,
  onText,
}: {
  page: Page;
  pageRef: PageRef;
  size: PageSize;
  photos: PhotoMap;
  width: number;
  minDpi: number;
  onPhoto: (ref: PageRef, id: string) => void;
  onText: (ref: PageRef, id: string) => void;
}) {
  const pending = usePendingUploads();
  const [over, setOver] = useState<string | null>(null);
  const dark = luminance(page.background.color) < 0.35;
  const pt = pageSizePt(size);
  const frames = page.elements.filter((e): e is PhotoElement => e.type === 'photo');
  const texts = page.elements.filter((e): e is TextElement => e.type === 'text');
  return (
    <PageView page={page} size={size} photos={photos} renderWidth={width} emptyFrames="placeholder" eager>
      {frames.map((el) => {
        const asset = el.photoId ? photos[el.photoId] : undefined;
        const filled = !!asset;
        const small = el.w * width < 96;
        // Too few pixels for the frame: it would look soft in the PDF, so say so where it matters.
        const lowRes = !!asset && effectiveDpi(asset.width, asset.height, el.w * pt.w, el.h * pt.h, el.crop) < minDpi;
        const progress = el.photoId ? pending.get(el.photoId) : undefined;
        const target = { ref: pageRef, id: el.id };
        return (
          <button
            key={el.id}
            type="button"
            onClick={() => onPhoto(pageRef, el.id)}
            onDragOver={(e) => {
              if (!accepts(e)) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              if (over !== el.id) setOver(el.id);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOver(null);
              const id = e.dataTransfer.getData(PHOTO_MIME);
              if (id) {
                assignPhoto(target, id);
                useEditor.getState().toast(filled ? 'Photo changed' : 'Photo added', 'success');
              } else if (e.dataTransfer.files.length) uploadInto(target, [...e.dataTransfer.files]);
            }}
            aria-label={filled ? 'Adjust or change this photo' : 'Add a photo here'}
            title={filled ? 'Adjust or change this photo' : 'Add a photo'}
            style={box(el)}
            className={`group/frame absolute grid place-items-center transition-colors active:bg-black/15 ${over === el.id ? 'bg-accent/25 outline outline-2 -outline-offset-2 outline-accent' : 'hover:bg-black/10'}`}
          >
            {!filled && (
              <span className={`pointer-events-none flex items-center gap-1 rounded-full bg-white/95 text-ink shadow-[0_4px_12px_-4px_rgb(0_0_0/.35)] ${small ? 'p-1.5' : 'px-3 py-1.5 text-[11px] font-medium'}`}>
                <Plus size={small ? 14 : 13} className="text-accent" strokeWidth={2.4} />
                {!small && 'Add photo'}
              </span>
            )}
            {filled && !small && (
              <span className="pointer-events-none hidden items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-medium text-ink opacity-0 shadow-[0_4px_12px_-4px_rgb(0_0_0/.35)] transition-opacity group-hover/frame:opacity-100 [@media(hover:hover)]:flex">
                <Move size={13} className="text-accent" /> Adjust
              </span>
            )}
            {lowRes && (
              <span className="pointer-events-none absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm" title="This photo is small for its frame and may look soft. Try a larger photo.">
                <AlertTriangle size={11} /> {!small && 'Low resolution'}
              </span>
            )}
            {progress !== undefined && (
              <span aria-hidden className="pointer-events-none absolute inset-x-1.5 bottom-1.5 h-[3px] overflow-hidden rounded-full bg-black/30">
                <span className="block h-full bg-white transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
              </span>
            )}
          </button>
        );
      })}
      {texts.map((el) => (
        <button
          key={el.id}
          type="button"
          onClick={() => onText(pageRef, el.id)}
          aria-label={el.text.trim() ? `Edit text: ${el.text.slice(0, 40)}` : 'Add text'}
          title="Edit text"
          style={box(el)}
          className={`absolute rounded-[2px] outline-1 outline-offset-2 outline-dashed transition before:absolute before:-inset-2 before:content-[''] hover:bg-accent/5 hover:outline-2 active:bg-accent/10 ${dark ? 'outline-white/45' : 'outline-accent/40'}`}
        >
          {!el.text.trim() && <span className={`text-[10px] italic ${dark ? 'text-white/70' : 'text-muted'}`}>Tap to add text</span>}
        </button>
      ))}
    </PageView>
  );
});

/* ------------------------------ desktop library ------------------------------ */

function LibraryPanel({ refs }: { refs: Array<PageRef | null> }) {
  const doc = useEditor((s) => s.doc)!;
  const photos = useEditor((s) => s.photos);
  const pending = usePendingUploads();
  const input = useRef<HTMLInputElement>(null);
  const used = useMemo(() => usedPhotoIds(doc), [doc]);
  const empty = useMemo(() => emptyFrameCount(doc), [doc]);
  const unused = photos.filter((p) => !used.has(p.id)).length;
  const ordered = useMemo(() => [...photos.filter((p) => !used.has(p.id)), ...photos.filter((p) => used.has(p.id))], [photos, used]);

  const fill = () => {
    const s = useEditor.getState();
    let n = 0;
    s.apply((d) => void (n = autofill(d as AlbumDocument, s.photos)));
    s.toast(n ? `Filled ${n} empty ${n === 1 ? 'frame' : 'frames'}` : 'No unused photos left to place', n ? 'success' : undefined);
  };

  return (
    <aside className="flex w-[19rem] shrink-0 flex-col border-r border-line bg-card" aria-label="Your photos">
      <div className="space-y-3 border-b border-line p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl leading-none">Your photos</h2>
          <span className="text-xs tabular-nums text-muted">{photos.length}</span>
        </div>
        <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { uploadInto(null, [...(e.target.files ?? [])]); e.target.value = ''; }} />
        <button type="button" onClick={() => input.current?.click()} className="btn btn-primary w-full text-[0.75rem] uppercase tracking-[0.16em]">
          <ImagePlus size={16} /> Upload photos
        </button>
        {empty > 0 && unused > 0 && (
          <button type="button" onClick={fill} className="btn btn-secondary w-full text-[0.75rem] uppercase tracking-[0.16em]">
            <Wand2 size={15} /> Fill {Math.min(empty, unused)} empty {Math.min(empty, unused) === 1 ? 'frame' : 'frames'}
          </button>
        )}
        <UploadStatus compact />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {photos.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <p className="max-w-[14rem] text-sm text-muted">Upload or drop your photos here — they fill the frames of your album for you.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs leading-relaxed text-muted">Drag a photo onto any frame, or click to add it to the pages in view.</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ordered.map((p) => (
                <PhotoThumb
                  key={p.id}
                  photo={p}
                  used={used.has(p.id)}
                  progress={pending.get(p.id)}
                  draggable
                  onPick={() => {
                    if (!placeOnSpread(refs, p)) useEditor.getState().toast('These pages are full — drag the photo onto one to swap it');
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

/* -------------------------------- bottom bar -------------------------------- */

function BottomBar({ index, slides, doc, photos, photoCount, showActions, onPick, onLibrary }: { index: number; slides: Slide[]; doc: AlbumDocument; photos: PhotoMap; photoCount: number; showActions: boolean; onPick: (i: number) => void; onLibrary: () => void }) {
  const stats = useUploadStats();
  const strip = useRef<HTMLDivElement>(null);
  const empty = useMemo(() => emptyFrameCount(doc), [doc]);
  const unused = useMemo(() => {
    const used = usedPhotoIds(doc);
    return Object.keys(photos).filter((id) => !used.has(id)).length;
  }, [doc, photos]);

  // Keep the current page's thumbnail in view.
  useEffect(() => {
    const el = strip.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  const fill = () => {
    const s = useEditor.getState();
    let n = 0;
    s.apply((d) => void (n = autofill(d as AlbumDocument, s.photos)));
    s.toast(n ? `Filled ${n} empty ${n === 1 ? 'frame' : 'frames'}` : 'No unused photos left to place', n ? 'success' : undefined);
  };

  return (
    <div className="relative shrink-0 border-t border-line bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {showActions && stats.active && (
        <button type="button" onClick={onLibrary} className="block w-full px-4 pt-2 text-left">
          <span className="flex justify-between text-[11px] text-muted">
            <span>
              Uploading — {stats.done} of {stats.live} done
            </span>
            <span className="tabular-nums">{Math.round(stats.progress * 100)}%</span>
          </span>
          <span className="mt-1 block h-[2px] bg-line">
            <span className="block h-full bg-accent transition-[width] duration-300" style={{ width: `${stats.progress * 100}%` }} />
          </span>
        </button>
      )}
      {showActions && !stats.active && stats.errors.length > 0 && (
        <button type="button" onClick={onLibrary} className="flex w-full items-center gap-2 px-4 pt-2 text-left text-[12px] text-danger">
          <AlertCircle size={13} /> {stats.errors.length} {stats.errors.length === 1 ? 'photo' : 'photos'} couldn’t upload · <span className="underline">Review</span>
        </button>
      )}
      <div ref={strip} className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-3 md:justify-center-safe md:gap-3" role="tablist" aria-label="Pages">
        {slides.map((slide, i) => (
          <Thumb key={i} refs={slide.refs} doc={doc} photos={photos} label={slide.short} active={i === index} onClick={() => onPick(i)} />
        ))}
      </div>
      {showActions && (
        <div className="flex gap-2 px-4">
          <button type="button" onClick={onLibrary} className={`btn h-11 flex-1 text-[0.75rem] uppercase tracking-[0.16em] ${photoCount ? 'btn-secondary' : 'btn-primary'}`}>
            <ImagePlus size={16} /> {photoCount ? `Photos · ${photoCount}` : 'Add your photos'}
          </button>
          {empty > 0 && unused > 0 && (
            <button type="button" onClick={fill} className="btn btn-secondary h-11 shrink-0 text-[0.75rem] uppercase tracking-[0.16em]">
              <Wand2 size={15} /> Fill {Math.min(empty, unused)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const Thumb = memo(function Thumb({ refs, doc, photos, label, active, onClick }: { refs: Array<PageRef | null>; doc: AlbumDocument; photos: PhotoMap; label: string; active: boolean; onClick: () => void }) {
  const finish = bookFinish(doc);
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className="flex shrink-0 flex-col items-center gap-1">
      <span className={`flex overflow-hidden rounded-[2px] transition ${active ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : 'opacity-80 ring-1 ring-line hover:opacity-100'}`}>
        {refs.map((ref, k) =>
          ref ? (
            <span key={k} className="block w-11 md:w-12">
              <PageView page={pageAt(doc, ref)!} size={doc.size} photos={photos} renderWidth={60} emptyFrames="placeholder" />
            </span>
          ) : (
            <span key={k} className="block w-11 md:w-12" style={{ aspectRatio: `${doc.size.widthMm} / ${doc.size.heightMm}`, background: finish.endpaper }} />
          ),
        )}
      </span>
      <span className={`text-[10px] tabular-nums ${active ? 'font-medium text-accent' : 'text-muted'}`}>{label}</span>
    </button>
  );
});

/* ----------------------------------- sheets ----------------------------------- */

/** Bottom sheet on phones, centred dialog on larger screens. */
function Sheet({ title, onClose, children, footer, keyboard = false }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; keyboard?: boolean }) {
  const wide = useWide();
  const inset = useKeyboardInset();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const lift = keyboard && !wide ? inset : 0;
  return (
    <div className="fixed inset-0 z-50 md:grid md:place-items-center md:p-8">
      {/* Text editing keeps the page visible behind, so changes can be watched as they're typed. */}
      <button type="button" aria-label="Close" onClick={onClose} className={`animate-fade-in absolute inset-0 ${keyboard ? 'bg-ink/15' : 'bg-ink/45'}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={wide ? undefined : { bottom: lift, maxHeight: lift ? `calc(100dvh - ${lift}px - 3rem)` : '88dvh' }}
        className={
          wide
            ? `animate-fade-up relative flex max-h-[min(42rem,calc(100dvh-4rem))] w-full max-w-xl flex-col rounded-[6px] bg-card shadow-pop ${keyboard ? 'md:mt-auto md:mb-6' : ''}`
            : 'animate-sheet-up absolute inset-x-0 flex flex-col rounded-t-[14px] bg-card shadow-pop'
        }
      >
        <div className="shrink-0 px-5 pb-2 pt-2.5 md:px-6 md:pt-5">
          {!wide && <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line-strong" />}
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl leading-none md:text-[1.75rem]">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid h-10 w-10 place-items-center text-muted hover:text-ink active:text-ink">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 md:px-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-6 md:pb-5">{footer}</div>}
      </div>
    </div>
  );
}

function PhotoSheet({ target, refs, minDpi, onClose }: { target: Target | null; refs: Array<PageRef | null>; minDpi: number; onClose: () => void }) {
  const doc = useEditor((s) => s.doc)!;
  const photos = useEditor((s) => s.photos);
  const photoMap = useEditor((s) => s.photoMap);
  const pending = usePendingUploads();
  const input = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const frame = target ? (findElement(doc, target.ref, target.id) as PhotoElement | undefined) : undefined;
  const current = frame?.photoId ? photoMap[frame.photoId] : undefined;
  const used = useMemo(() => usedPhotoIds(doc), [doc]);
  // Unused photos first: they're the ones people are looking for.
  const ordered = useMemo(() => [...photos.filter((p) => !used.has(p.id)), ...photos.filter((p) => used.has(p.id))], [photos, used]);

  const choose = (photo: PhotoAsset) => {
    const s = useEditor.getState();
    if (target) {
      // Stay open on the new photo, so it can be framed right away.
      assignPhoto(target, photo.id);
      s.toast(current ? 'Photo changed — drag or zoom to frame it' : 'Photo added — drag or zoom to frame it', 'success');
      top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else if (placeOnSpread(refs, photo)) onClose();
    else s.toast('This page is full — tap a photo on the page to swap it');
  };

  const remove = () => {
    if (!target) return;
    useEditor.getState().updateElement(target.ref, target.id, { photoId: null } as Partial<PhotoElement>);
    onClose();
  };

  const adjusting = !!(target && frame && current);
  const uploadLabel = (
    <>
      <span className="md:hidden">{adjusting ? 'New photo' : 'Upload from phone'}</span>
      <span className="hidden md:inline">{adjusting ? 'Upload new' : 'Upload from computer'}</span>
    </>
  );

  return (
    <Sheet
      title={adjusting ? 'Adjust photo' : target ? 'Add a photo' : 'Your photos'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              uploadInto(target, [...(e.target.files ?? [])]);
              e.target.value = '';
              // Into a frame: stay here — the photo appears in the frame editor in a moment.
              if (!target) onClose();
            }}
          />
          {adjusting ? (
            <>
              <button type="button" onClick={() => input.current?.click()} className="btn btn-secondary h-12 shrink-0 px-4 text-[0.6875rem] uppercase tracking-[0.14em]">
                <Upload size={16} /> {uploadLabel}
              </button>
              <button type="button" onClick={remove} aria-label="Remove photo from this frame" title="Remove photo from this frame" className="btn btn-secondary h-12 w-12 shrink-0 !p-0 text-danger">
                <Trash2 size={17} />
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary h-12 flex-1 text-[0.75rem] uppercase tracking-[0.16em]">
                <Check size={16} /> Done
              </button>
            </>
          ) : (
            <button type="button" onClick={() => input.current?.click()} className="btn btn-primary h-12 flex-1 text-[0.75rem] uppercase tracking-[0.16em]">
              <ImagePlus size={17} /> {uploadLabel}
            </button>
          )}
        </div>
      }
    >
      <div ref={top} className="scroll-mt-4" />
      {adjusting && <CropEditor key={current!.id} target={target!} el={frame!} asset={current!} size={doc.size} minDpi={minDpi} />}
      <UploadStatus compact />
      {photos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No photos yet. Upload a few — they fill the empty frames for you.</p>
      ) : (
        <>
          {adjusting && <p className="smallcaps mt-7">Or choose another photo</p>}
          <p className="mb-3 mt-1 text-[13px] text-muted">
            {adjusting ? 'Tap one to put it in this frame instead.' : target ? 'Choose a photo to put here.' : 'Choose a photo to add it to this page.'}{' '}
            <span className="inline-flex translate-y-[2px] items-center gap-1">
              <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-ink/65 text-white">
                <Check size={8} strokeWidth={3} />
              </span>
              already used
            </span>
          </p>
          <div className="grid grid-cols-4 gap-1.5 md:grid-cols-5">
            {ordered.map((p) => (
              <PhotoThumb key={p.id} photo={p} used={used.has(p.id)} here={current?.id === p.id} progress={pending.get(p.id)} onPick={() => choose(p)} />
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}

/** Deletes a photo from the library (and from any frame using it). */
async function deletePhoto(photo: PhotoAsset, inAlbum: boolean) {
  if (inAlbum && !window.confirm('This photo is on a page of your album. Delete it? Its frame will be left empty.')) return;
  const s = useEditor.getState();
  if (inAlbum) s.apply((d) => void clearPhoto(d as AlbumDocument, photo.id));
  s.removePhoto(photo.id);
  const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' }).catch(() => null);
  if (res && (res.ok || res.status === 404)) s.toast('Photo deleted', 'success');
  else {
    useEditor.getState().addPhotos([photo]);
    s.toast('Couldn’t delete that photo — please try again', 'error');
  }
}

/** A photo in the library: pick it, drag it (desktop), or delete it. */
function PhotoThumb({ photo, used, here = false, progress, draggable = false, onPick }: { photo: PhotoAsset; used: boolean; here?: boolean; progress?: number; draggable?: boolean; onPick: () => void }) {
  return (
    <div className="group/thumb relative aspect-square">
      <button
        type="button"
        onClick={onPick}
        disabled={here}
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.setData(PHOTO_MIME, photo.id);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        title={photo.alt}
        className={`block h-full w-full overflow-hidden rounded-[2px] bg-paper-2 transition hover:opacity-90 active:opacity-80 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${here ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : ''}`}
      >
        <img src={photo.thumbUrl} alt={photo.alt ?? ''} loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
      </button>
      {used && !here && (
        <span className="pointer-events-none absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded-full bg-ink/65 text-white" aria-label="Already in the album">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
      {here && <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-accent px-1.5 py-px text-[9px] font-medium uppercase tracking-wider text-white">Here</span>}
      {progress !== undefined && (
        <span aria-hidden className="pointer-events-none absolute inset-x-1 bottom-1 h-[3px] overflow-hidden rounded-full bg-black/30">
          <span className="block h-full bg-white" style={{ width: `${progress * 100}%` }} />
        </span>
      )}
      <button
        type="button"
        onClick={() => void deletePhoto(photo, used)}
        aria-label="Delete photo"
        title="Delete photo"
        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-ink-soft opacity-0 shadow-[0_2px_6px_rgb(0_0_0/.25)] transition hover:text-danger focus:opacity-100 group-hover/thumb:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <X size={13} strokeWidth={2.4} />
      </button>
    </div>
  );
}

/* --------------------------------- framing --------------------------------- */

const MAX_ZOOM = 4;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(1, z));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Frames a photo inside its frame: drag to reposition, pinch / scroll / slider
 * to zoom. The frame itself never moves. What's outside the frame stays
 * visible but dimmed, so it's obvious what will be cut off.
 */
function CropEditor({ target, el, asset, size, minDpi }: { target: Target; el: PhotoElement; asset: PhotoAsset; size: PageSize; minDpi: number }) {
  const wide = useWide();
  const pt = pageSizePt(size);
  const rawW = el.w * pt.w;
  const rawH = el.h * pt.h;
  const bw = Math.max(0, Math.min(el.borderWidth, rawW / 2 - 1, rawH / 2 - 1));
  const fw = rawW - bw * 2;
  const fh = rawH - bw * 2;
  const ratio = fw / fh;

  const [crop, setCrop] = useState<Crop>(el.crop);
  const latest = useRef<Crop>(el.crop);
  const frameRaf = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(320);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; zoom: number } | null>(null);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  /** Shows the change at once; writes it to the album once per frame (one undo step per gesture run). */
  const apply = useCallback(
    (next: Crop) => {
      latest.current = next;
      setCrop(next);
      if (frameRaf.current) return;
      frameRaf.current = requestAnimationFrame(() => {
        frameRaf.current = 0;
        const c = latest.current;
        useEditor.getState().updateElement(target.ref, target.id, (d) => void ((d as PhotoElement).crop = { zoom: c.zoom, fx: c.fx, fy: c.fy }), { key: `crop:${target.id}` });
      });
    },
    [target],
  );

  // Scroll wheel / trackpad pinch zooms (needs a non-passive listener to keep the page still).
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const c = latest.current;
      apply({ ...c, zoom: clampZoom(c.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))) });
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [apply]);

  const maxH = wide ? 340 : 250;
  const W = Math.max(80, Math.min(stageW * 0.82, maxH * ratio));
  const H = W / ratio;
  const pad = wide ? 28 : 22;
  const left = (stageW - W) / 2;
  const c = computeCrop(asset.width, asset.height, fw, fh, crop);
  const soft = effectiveDpi(asset.width, asset.height, fw, fh, crop) < minDpi;

  const down = (e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.max(1, distance(a, b)), zoom: latest.current.zoom };
    }
    setDragging(true);
  };
  const move = (e: ReactPointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);
    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      apply({ ...latest.current, zoom: clampZoom((pinch.current.zoom * distance(a, b)) / pinch.current.d) });
      return;
    }
    apply(panCrop(asset.width, asset.height, fw, fh, latest.current, (now.x - prev.x) / W, (now.y - prev.y) / H));
  };
  const up = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!pointers.current.size) setDragging(false);
  };

  const zoomBy = (delta: number) => apply({ ...latest.current, zoom: clampZoom(Math.round((latest.current.zoom + delta) * 4) / 4) });
  const changed = Math.abs(crop.zoom - 1) > 0.001 || Math.abs(crop.fx - 0.5) > 0.001 || Math.abs(crop.fy - 0.5) > 0.001;

  return (
    <div>
      <div
        ref={stage}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="application"
        aria-label="Photo framing: drag to reposition, pinch or scroll to zoom"
        className={`relative select-none overflow-hidden rounded-[4px] bg-[#1b1214] touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: H + pad * 2 }}
      >
        <img
          src={asset.displayUrl}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none"
          style={{ left: left + c.relX * W, top: pad + c.relY * H, width: c.relW * W, height: c.relH * H }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left,
            top: pad,
            width: W,
            height: H,
            borderRadius: el.shape === 'ellipse' ? '50%' : 2,
            boxShadow: '0 0 0 1px rgb(255 255 255 / .9), 0 0 0 9999px rgb(24 15 17 / .66)',
          }}
        >
          {/* Thirds, while moving: a gentle guide for placing faces and horizons. */}
          <span className={`absolute inset-0 transition-opacity duration-200 ${dragging ? 'opacity-100' : 'opacity-0'}`}>
            <span className="absolute inset-y-0 left-1/3 w-px bg-white/45" />
            <span className="absolute inset-y-0 left-2/3 w-px bg-white/45" />
            <span className="absolute inset-x-0 top-1/3 h-px bg-white/45" />
            <span className="absolute inset-x-0 top-2/3 h-px bg-white/45" />
          </span>
        </div>
        {!dragging && !changed && (
          <span className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/55 px-3 py-1 text-[11px] text-white">
            <Move size={12} /> {wide ? 'Drag to reposition · scroll to zoom' : 'Drag to reposition · pinch to zoom'}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={() => zoomBy(-0.25)} disabled={crop.zoom <= 1} aria-label="Zoom out" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-2 disabled:opacity-30">
          <Minus size={18} />
        </button>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          onChange={(e) => apply({ ...latest.current, zoom: clampZoom(Number(e.target.value)) })}
          aria-label="Zoom"
          className="h-10 min-w-0 flex-1 cursor-pointer accent-[var(--color-accent)]"
        />
        <button type="button" onClick={() => zoomBy(0.25)} disabled={crop.zoom >= MAX_ZOOM} aria-label="Zoom in" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-2 disabled:opacity-30">
          <Plus size={18} />
        </button>
        <button type="button" onClick={() => apply({ zoom: 1, fx: 0.5, fy: 0.5 })} disabled={!changed} className="ml-1 inline-flex h-10 shrink-0 items-center gap-1 px-2 text-xs font-medium text-ink-soft hover:text-ink disabled:opacity-30">
          <RotateCcw size={13} /> Reset
        </button>
      </div>
      {soft && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-warning">
          <AlertTriangle size={13} /> Zoomed in a lot — this photo may look soft. Zoom out a little, or use a larger photo.
        </p>
      )}
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = { title: 'title', subtitle: 'subtitle', heading: 'heading', body: 'text', caption: 'caption', label: 'label' };

function TextSheet({ target, onClose }: { target: Target; onClose: () => void }) {
  const doc = useEditor((s) => s.doc)!;
  const el = findElement(doc, target.ref, target.id) as TextElement | undefined;
  const [value, setValue] = useState(el?.text ?? '');
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = area.current;
    if (!t) return;
    t.focus({ preventScroll: true });
    t.setSelectionRange(t.value.length, t.value.length);
  }, []);

  if (!el) return null;
  const change = (v: string) => {
    setValue(v);
    useEditor.getState().updateElement(target.ref, target.id, { text: v } as Partial<TextElement>, { key: `text:${target.id}` });
  };
  const lines = Math.min(6, Math.max(2, value.split('\n').length + (value.length > 60 ? 1 : 0)));

  return (
    <Sheet
      title={`Edit ${(el.role && ROLE_LABEL[el.role]) || 'text'}`}
      onClose={onClose}
      keyboard
      footer={
        <button type="button" onClick={onClose} className="btn btn-primary h-12 w-full text-[0.75rem] uppercase tracking-[0.16em]">
          <Check size={16} /> Done
        </button>
      }
    >
      <textarea
        ref={area}
        value={value}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onClose();
        }}
        rows={lines}
        placeholder="Write something…"
        className="input mt-1 resize-none !text-[17px] leading-snug"
        style={{ fontFamily: cssFontStack(el.font), fontStyle: el.italic ? 'italic' : undefined, fontWeight: Math.min(el.weight, 600) }}
        aria-label="Text"
      />
      <p className="mt-2 text-[12px] text-muted">Changes appear on the page as you type.</p>
    </Sheet>
  );
}

/* ------------------------------- first-time tip ------------------------------- */

function FirstTimeTip({ wide }: { wide: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      // Browser storage is only readable after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(TIP_KEY)) setOpen(true);
    } catch {}
  }, []);
  if (!open) return null;
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(TIP_KEY, '1');
    } catch {}
  };
  return (
    <div className="absolute inset-x-4 bottom-3 z-30 mx-auto flex max-w-md items-start gap-3 rounded-[4px] bg-ink px-4 py-3 text-paper shadow-pop animate-fade-up">
      <span className="mt-0.5 h-8 w-1.5 shrink-0 rounded-b-[1px] bg-accent" aria-hidden />
      <p className="flex-1 text-[13px] leading-snug">
        {wide ? (
          <>
            <span className="font-medium">Click a photo</span> to zoom, reposition or change it — or drag one from your library onto it. <span className="font-medium">Click any text</span> to rewrite it. Use ← → to turn pages.
          </>
        ) : (
          <>
            <span className="font-medium">Tap a photo</span> to zoom, reposition or change it. <span className="font-medium">Tap any text</span> to rewrite it. Swipe for the next page.
          </>
        )}
      </p>
      <button type="button" onClick={close} aria-label="Got it" className="-mr-1 shrink-0 p-1 text-paper/70 hover:text-paper">
        <X size={16} />
      </button>
    </div>
  );
}
