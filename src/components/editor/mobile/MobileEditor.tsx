'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, Check, ChevronLeft, ChevronRight, CloudOff, Eye, ImagePlus, Loader2, Plus, Trash2, Undo2, Wand2, X } from 'lucide-react';
import { PageView } from '@/components/album/PageView';
import { luminance } from '@/lib/album/color';
import { cssFontStack } from '@/lib/album/fonts';
import { allPages, autofill, findElement, pageAt } from '@/lib/album/ops';
import type { AlbumDocument, AlbumElement, Page, PageRef, PageSize, PhotoAsset, PhotoElement, PhotoMap, TextElement } from '@/lib/album/types';
import { useEditor } from '../store';
import { uploadFiles } from '../uploads';
import { UploadStatus, usePendingUploads, useUploadStats } from '../UploadStatus';

/**
 * The phone editor. Deliberately simple: nothing on the page can be moved or
 * resized. You swipe through the pages, tap a photo to change it and tap a
 * piece of text to rewrite it — everything else is already designed.
 */

type Target = { ref: PageRef; id: string };
type SheetState = { kind: 'photo'; target: Target | null } | { kind: 'text'; target: Target } | null;

const ACCEPT = 'image/jpeg,image/png,image/webp';
const TIP_KEY = 'fs:mobile-tip:v1';
const pct = (n: number) => `${n * 100}%`;

function refsFor(pageCount: number): PageRef[] {
  return [{ kind: 'cover' }, ...Array.from({ length: pageCount }, (_, index) => ({ kind: 'page' as const, index })), { kind: 'back' }];
}
const longLabel = (ref: PageRef, total: number) => (ref.kind === 'cover' ? 'Cover' : ref.kind === 'back' ? 'Back cover' : `Page ${ref.index + 1} of ${total}`);
const shortLabel = (ref: PageRef) => (ref.kind === 'cover' ? 'Cover' : ref.kind === 'back' ? 'Back' : String(ref.index + 1));

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

/** Height the on-screen keyboard takes from the bottom of the layout viewport (iOS and Android). */
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

export function MobileEditor({ save, banners }: { save: () => Promise<boolean>; banners?: ReactNode }) {
  const router = useRouter();
  const doc = useEditor((s) => s.doc)!;
  const photoMap = useEditor((s) => s.photoMap);
  const photoCount = useEditor((s) => s.photos.length);
  const toasts = useEditor((s) => s.toasts);
  const pageCount = doc.pages.length;
  const refs = useMemo(() => refsFor(pageCount), [pageCount]);
  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 360, h: 480 });
  const raf = useRef(0);

  // Size pages to the space between the bars, whatever the phone.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const ref = refs[Math.min(index, refs.length - 1)];
    if (ref) useEditor.getState().setActive(ref);
  }, [index, refs]);

  const ratio = doc.size.widthMm / doc.size.heightMm;
  const pageW = Math.max(120, Math.floor(Math.min(box.w - 40, (box.h - 56) * ratio)));

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = scroller.current;
      if (el && el.clientWidth) setIndex(Math.max(0, Math.min(refs.length - 1, Math.round(el.scrollLeft / el.clientWidth))));
    });
  };
  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(refs.length - 1, i)) * el.clientWidth, behavior: 'smooth' });
  };

  const go = async (href: string) => {
    setLeaving(href);
    await save();
    router.push(href);
  };

  const onPhoto = (ref: PageRef, id: string) => setSheet({ kind: 'photo', target: { ref, id } });
  const onText = (ref: PageRef, id: string) => setSheet({ kind: 'text', target: { ref, id } });

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-editor text-ink">
      <TopBar onPreview={() => go(`/projects/${useEditor.getState().projectId}/preview`)} onNext={() => go(`/projects/${useEditor.getState().projectId}/checkout`)} leaving={leaving} />
      {banners}

      <div className="relative min-h-0 flex-1">
        <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain" aria-roledescription="carousel" aria-label="Album pages">
          {refs.map((ref, i) => {
            const page = pageAt(doc, ref)!;
            const near = Math.abs(i - index) <= 2;
            return (
              <section key={`${ref.kind}-${i}`} aria-label={longLabel(ref, pageCount)} className="flex h-full w-full shrink-0 snap-center snap-always flex-col items-center justify-center px-5">
                <div style={{ width: pageW }} className={`overflow-hidden bg-white ${ref.kind === 'page' ? 'rounded-[2px]' : 'rounded-[3px]'} shadow-[0_2px_6px_rgb(19_12_13/.08),0_22px_40px_-18px_rgb(19_12_13/.45)]`}>
                  {near ? (
                    <TapPage page={page} pageRef={ref} size={doc.size} photos={photoMap} width={pageW} onPhoto={onPhoto} onText={onText} />
                  ) : (
                    <div style={{ aspectRatio: `${doc.size.widthMm} / ${doc.size.heightMm}`, background: page.background.color }} />
                  )}
                </div>
                <p className="smallcaps mt-4">{longLabel(ref, pageCount)}</p>
              </section>
            );
          })}
        </div>
        {index > 0 && (
          <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous page" className="absolute left-1 top-1/2 grid h-10 w-8 -translate-y-1/2 place-items-center text-ink/50 active:text-ink">
            <ChevronLeft size={22} />
          </button>
        )}
        {index < refs.length - 1 && (
          <button type="button" onClick={() => goTo(index + 1)} aria-label="Next page" className="absolute right-1 top-1/2 grid h-10 w-8 -translate-y-1/2 place-items-center text-ink/50 active:text-ink">
            <ChevronRight size={22} />
          </button>
        )}
        <FirstTimeTip />
        <div className="pointer-events-none absolute inset-x-0 top-3 z-40 flex flex-col items-center gap-2 px-4">
          {toasts.map((t) => (
            <div key={t.id} role="status" className={`pointer-events-auto max-w-full rounded-full px-4 py-2 text-center text-[13px] shadow-pop animate-fade-up ${t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-paper'}`}>
              {t.message.replace(' · ⌘Z to undo', '')}
            </div>
          ))}
        </div>
      </div>

      <BottomBar index={index} refs={refs} doc={doc} photos={photoMap} photoCount={photoCount} onPick={goTo} onLibrary={() => setSheet({ kind: 'photo', target: null })} />

      {sheet?.kind === 'photo' && <PhotoSheet target={sheet.target} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'text' && <TextSheet target={sheet.target} onClose={() => setSheet(null)} />}
    </div>
  );
}

/* ---------------------------------- top bar ---------------------------------- */

function TopBar({ onPreview, onNext, leaving }: { onPreview: () => void; onNext: () => void; leaving: string | null }) {
  const title = useEditor((s) => s.title);
  const canUndo = useEditor((s) => s.past.length > 0);
  const state = useEditor((s) => s.saveState);
  const status = {
    saved: { icon: <Check size={11} />, text: 'Saved', cls: 'text-muted' },
    dirty: { icon: <span className="h-1.5 w-1.5 rounded-full bg-warning" />, text: 'Saving soon', cls: 'text-muted' },
    saving: { icon: <Loader2 size={11} className="animate-spin" />, text: 'Saving…', cls: 'text-muted' },
    error: { icon: <CloudOff size={11} />, text: 'Offline — kept on this phone', cls: 'text-warning' },
    conflict: { icon: <AlertCircle size={11} />, text: 'Changed elsewhere', cls: 'text-danger' },
  }[state];
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-card pl-1 pr-2">
      <Link href="/dashboard" aria-label="All albums" className="grid h-11 w-10 shrink-0 place-items-center text-ink-soft active:text-ink">
        <ChevronLeft size={22} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[1.15rem] leading-tight">{title}</p>
        <p className={`flex items-center gap-1 text-[11px] leading-tight ${status.cls}`} aria-live="polite">
          {status.icon} {status.text}
        </p>
      </div>
      <button type="button" onClick={() => useEditor.getState().undo()} disabled={!canUndo} aria-label="Undo" className="grid h-11 w-10 shrink-0 place-items-center text-ink-soft disabled:opacity-30">
        <Undo2 size={19} />
      </button>
      <button type="button" onClick={onPreview} aria-label="Preview" className="grid h-11 w-10 shrink-0 place-items-center text-ink-soft">
        {leaving?.endsWith('/preview') ? <Loader2 size={19} className="animate-spin" /> : <Eye size={19} />}
      </button>
      <button type="button" onClick={onNext} className="btn btn-primary btn-sm ml-1 shrink-0 !px-3.5 text-[0.6875rem] uppercase tracking-[0.16em]">
        Next {leaving?.endsWith('/checkout') ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
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

/** A rendered page with tap targets over its photos and text. Nothing here can be dragged. */
const TapPage = memo(function TapPage({
  page,
  pageRef,
  size,
  photos,
  width,
  onPhoto,
  onText,
}: {
  page: Page;
  pageRef: PageRef;
  size: PageSize;
  photos: PhotoMap;
  width: number;
  onPhoto: (ref: PageRef, id: string) => void;
  onText: (ref: PageRef, id: string) => void;
}) {
  const pending = usePendingUploads();
  const dark = luminance(page.background.color) < 0.35;
  const frames = page.elements.filter((e): e is PhotoElement => e.type === 'photo');
  const texts = page.elements.filter((e): e is TextElement => e.type === 'text');
  return (
    <PageView page={page} size={size} photos={photos} renderWidth={width} emptyFrames="placeholder" eager>
      {frames.map((el) => {
        const filled = !!(el.photoId && photos[el.photoId]);
        const small = el.w * width < 96;
        const progress = el.photoId ? pending.get(el.photoId) : undefined;
        return (
          <button
            key={el.id}
            type="button"
            onClick={() => onPhoto(pageRef, el.id)}
            aria-label={filled ? 'Change this photo' : 'Add a photo here'}
            style={box(el)}
            className="absolute grid place-items-center transition-colors active:bg-black/15"
          >
            {!filled && (
              <span className={`flex items-center gap-1 rounded-full bg-white/95 text-ink shadow-[0_4px_12px_-4px_rgb(0_0_0/.35)] ${small ? 'p-1.5' : 'px-3 py-1.5 text-[11px] font-medium'}`}>
                <Plus size={small ? 14 : 13} className="text-accent" strokeWidth={2.4} />
                {!small && 'Add photo'}
              </span>
            )}
            {progress !== undefined && (
              <span aria-hidden className="absolute inset-x-1.5 bottom-1.5 h-[3px] overflow-hidden rounded-full bg-black/30">
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
          style={box(el)}
          className={`absolute rounded-[2px] outline-1 outline-offset-2 outline-dashed transition-colors before:absolute before:-inset-2 before:content-[''] active:bg-accent/10 ${dark ? 'outline-white/45' : 'outline-accent/40'}`}
        >
          {!el.text.trim() && <span className={`text-[10px] italic ${dark ? 'text-white/70' : 'text-muted'}`}>Tap to add text</span>}
        </button>
      ))}
    </PageView>
  );
});

/* -------------------------------- bottom bar -------------------------------- */

function BottomBar({ index, refs, doc, photos, photoCount, onPick, onLibrary }: { index: number; refs: PageRef[]; doc: AlbumDocument; photos: PhotoMap; photoCount: number; onPick: (i: number) => void; onLibrary: () => void }) {
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
      {stats.active && (
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
      {!stats.active && stats.errors.length > 0 && (
        <button type="button" onClick={onLibrary} className="flex w-full items-center gap-2 px-4 pt-2 text-left text-[12px] text-danger">
          <AlertCircle size={13} /> {stats.errors.length} {stats.errors.length === 1 ? 'photo' : 'photos'} couldn’t upload · <span className="underline">Review</span>
        </button>
      )}
      <div ref={strip} className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-3" role="tablist" aria-label="Pages">
        {refs.map((ref, i) => (
          <Thumb key={`${ref.kind}-${i}`} page={pageAt(doc, ref)!} size={doc.size} photos={photos} label={shortLabel(ref)} active={i === index} onClick={() => onPick(i)} />
        ))}
      </div>
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
    </div>
  );
}

const Thumb = memo(function Thumb({ page, size, photos, label, active, onClick }: { page: Page; size: PageSize; photos: PhotoMap; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className="flex shrink-0 flex-col items-center gap-1">
      <span className={`block w-11 overflow-hidden rounded-[2px] transition ${active ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : 'opacity-80 ring-1 ring-line'}`}>
        <PageView page={page} size={size} photos={photos} renderWidth={60} emptyFrames="placeholder" />
      </span>
      <span className={`text-[10px] tabular-nums ${active ? 'font-medium text-accent' : 'text-muted'}`}>{label}</span>
    </button>
  );
});

/* ----------------------------------- sheets ----------------------------------- */

function Sheet({ title, onClose, children, footer, keyboard = false }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; keyboard?: boolean }) {
  // Text sheets keep the page visible behind them, so changes can be watched as they're typed.
  const inset = useKeyboardInset();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" onClick={onClose} className={`animate-fade-in absolute inset-0 ${keyboard ? 'bg-ink/15' : 'bg-ink/45'}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ bottom: keyboard ? inset : 0, maxHeight: keyboard && inset ? `calc(100dvh - ${inset}px - 3rem)` : '88dvh' }}
        className="animate-sheet-up absolute inset-x-0 flex flex-col rounded-t-[14px] bg-card shadow-pop"
      >
        <div className="shrink-0 px-5 pb-2 pt-2.5">
          <span aria-hidden className="mx-auto block h-1 w-10 rounded-full bg-line-strong" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl leading-none">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid h-10 w-10 place-items-center text-muted active:text-ink">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>
  );
}

function PhotoSheet({ target, onClose }: { target: Target | null; onClose: () => void }) {
  const doc = useEditor((s) => s.doc)!;
  const photos = useEditor((s) => s.photos);
  const photoMap = useEditor((s) => s.photoMap);
  const pending = usePendingUploads();
  const input = useRef<HTMLInputElement>(null);
  const frame = target ? (findElement(doc, target.ref, target.id) as PhotoElement | undefined) : undefined;
  const current = frame?.photoId ? photoMap[frame.photoId] : undefined;
  const used = useMemo(() => usedPhotoIds(doc), [doc]);
  // Unused photos first: they're the ones people are looking for.
  const ordered = useMemo(() => [...photos.filter((p) => !used.has(p.id)), ...photos.filter((p) => used.has(p.id))], [photos, used]);

  const put = (photo: PhotoAsset, quiet = false) => {
    if (!target) return;
    const s = useEditor.getState();
    s.updateElement(target.ref, target.id, (d) => {
      const p = d as PhotoElement;
      p.photoId = photo.id;
      p.crop = { zoom: 1, fx: 0.5, fy: 0.5 };
    });
    if (!quiet) s.toast(current ? 'Photo changed' : 'Photo added', 'success');
  };

  const choose = (photo: PhotoAsset) => {
    if (target) {
      put(photo);
      onClose();
      return;
    }
    // From the library: drop it into the first empty frame of the page on screen.
    const s = useEditor.getState();
    const page = pageAt(s.doc!, s.active);
    const empty = page?.elements.find((e) => e.type === 'photo' && !e.photoId);
    if (empty) {
      s.updateElement(s.active, empty.id, (d) => {
        const p = d as PhotoElement;
        p.photoId = photo.id;
        p.crop = { zoom: 1, fx: 0.5, fy: 0.5 };
      });
      s.toast('Photo added to this page', 'success');
      onClose();
    } else s.toast('This page is full — tap a photo on the page to swap it');
  };

  const upload = (files: File[]) => {
    if (!files.length) return;
    let first = !!target;
    void uploadFiles(files, {
      // From a frame: the first photo goes into that frame, the rest fill any empty frames.
      autoPlace: !target,
      onShow: (batch) => {
        if (!target) return;
        let rest = batch;
        if (first && batch.length) {
          first = false;
          put(batch[0], true);
          rest = batch.slice(1);
        }
        if (rest.length) useEditor.getState().apply((d) => void autofill(d as AlbumDocument, rest));
      },
    });
    onClose();
  };

  const remove = () => {
    if (!target) return;
    useEditor.getState().updateElement(target.ref, target.id, { photoId: null } as Partial<PhotoElement>);
    onClose();
  };

  return (
    <Sheet
      title={target ? (current ? 'Change photo' : 'Add a photo') : 'Your photos'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { upload([...(e.target.files ?? [])]); e.target.value = ''; }} />
          <button type="button" onClick={() => input.current?.click()} className="btn btn-primary h-12 flex-1 text-[0.75rem] uppercase tracking-[0.16em]">
            <ImagePlus size={17} /> Upload from phone
          </button>
          {current && (
            <button type="button" onClick={remove} aria-label="Remove photo from this frame" className="btn btn-secondary h-12 w-12 shrink-0 !p-0 text-danger">
              <Trash2 size={17} />
            </button>
          )}
        </div>
      }
    >
      <UploadStatus compact />
      {photos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No photos yet. Upload a few — they fill the empty frames for you.</p>
      ) : (
        <>
          <p className="mb-3 mt-1 text-[13px] text-muted">{target ? 'Tap a photo to put it here.' : 'Tap a photo to add it to this page.'} <span className="inline-flex translate-y-[2px] items-center gap-1"><span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-ink/65 text-white"><Check size={8} strokeWidth={3} /></span> already used</span></p>
          <div className="grid grid-cols-3 gap-1.5">
            {ordered.map((p) => {
              const isCurrent = current?.id === p.id;
              const progress = pending.get(p.id);
              return (
                <button key={p.id} type="button" onClick={() => choose(p)} className={`relative aspect-square overflow-hidden rounded-[2px] bg-paper-2 active:opacity-80 ${isCurrent ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : ''}`}>
                  <img src={p.thumbUrl} alt={p.alt ?? ''} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  {used.has(p.id) && !isCurrent && (
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/65 text-white" aria-label="Already in the album">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                  {isCurrent && <span className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-px text-[9px] font-medium uppercase tracking-wider text-white">Here</span>}
                  {progress !== undefined && (
                    <span aria-hidden className="absolute inset-x-1 bottom-1 h-[3px] overflow-hidden rounded-full bg-black/30">
                      <span className="block h-full bg-white" style={{ width: `${progress * 100}%` }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}

const ROLE_LABEL: Record<string, string> = { title: 'Title', subtitle: 'Subtitle', heading: 'Heading', body: 'Text', caption: 'Caption', label: 'Label' };

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
      title={`Edit ${((el.role && ROLE_LABEL[el.role]) || 'text').toLowerCase()}`}
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
        rows={lines}
        placeholder="Write something…"
        className="input mt-1 resize-none !text-[17px] leading-snug"
        style={{ fontFamily: cssFontStack(el.font), fontStyle: el.italic ? 'italic' : undefined, fontWeight: Math.min(el.weight, 600) }}
        enterKeyHint="done"
        aria-label="Text"
      />
      <p className="mt-2 text-[12px] text-muted">Changes appear on the page as you type.</p>
    </Sheet>
  );
}

/* ------------------------------- first-time tip ------------------------------- */

function FirstTimeTip() {
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
    <div className="absolute inset-x-4 bottom-3 z-30 flex items-start gap-3 rounded-[4px] bg-ink px-4 py-3 text-paper shadow-pop animate-fade-up">
      <span className="mt-0.5 h-8 w-1.5 shrink-0 rounded-b-[1px] bg-accent" aria-hidden />
      <p className="flex-1 text-[13px] leading-snug">
        <span className="font-medium">Tap a photo</span> to change it, <span className="font-medium">tap any text</span> to rewrite it. Swipe for the next page.
      </p>
      <button type="button" onClick={close} aria-label="Got it" className="-mr-1 shrink-0 p-1 text-paper/70">
        <X size={16} />
      </button>
    </div>
  );
}
