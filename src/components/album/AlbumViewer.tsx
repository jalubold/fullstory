'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Columns2, Expand, Minimize, Minus, Plus, RectangleVertical } from 'lucide-react';
import { buildViewItems, spreadIndexOfPage, type ViewItem } from '@/lib/album/geometry';
import { bookFinish } from '@/lib/album/color';
import { ANIMATIONS, presentationOf } from '@/lib/album/presentation';
import type { AlbumDocument, PageAnimation, PhotoMap, Presentation } from '@/lib/album/types';
import { BookCover, FlatPage, OpenBook } from './Book';
import { FlipBook } from './FlipBook';

export interface AlbumViewerProps {
  doc: AlbumDocument;
  photos: PhotoMap;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  banner?: ReactNode;
  /** Overrides the document's own presentation (e.g. the latest settings on a share link). */
  presentation?: Presentation;
  /** Let visitors try the page animations (template demos). */
  animationPicker?: boolean;
}

/** Ramps an audio element's volume for a gentle start. */
function fadeIn(a: HTMLAudioElement, to = 0.85, ms = 1600) {
  const steps = 24;
  let i = 0;
  const t = window.setInterval(() => {
    i++;
    a.volume = Math.min(to, (to * i) / steps);
    if (i >= steps) window.clearInterval(t);
  }, ms / steps);
}

const ZOOMS = [1, 1.5, 2, 3];

export function itemLabel(item: ViewItem, pageCount: number): string {
  switch (item.kind) {
    case 'cover':
      return 'Front cover';
    case 'back':
      return 'Back cover';
    case 'page':
      return `Page ${item.index + 1} of ${pageCount}`;
    case 'spread':
      if (item.left === null) return `Page ${item.right! + 1}`;
      if (item.right === null) return `Page ${item.left + 1}`;
      return `Pages ${item.left + 1}–${item.right + 1}`;
  }
}

function itemAspect(item: ViewItem, doc: AlbumDocument) {
  const a = doc.size.widthMm / doc.size.heightMm;
  return item.kind === 'spread' ? a * 2 : a;
}

function ItemView({ item, doc, photos, width, eager }: { item: ViewItem; doc: AlbumDocument; photos: PhotoMap; width: number; eager?: boolean }) {
  const common = { size: doc.size, photos, renderWidth: width, eager };
  if (item.kind === 'cover') return <BookCover page={doc.cover} {...common} />;
  if (item.kind === 'back') return <FlatPage page={doc.backCover} {...common} className="!rounded-[3px_1px_1px_3px]" />;
  if (item.kind === 'page') return <FlatPage page={doc.pages[item.index]} {...common} />;
  return (
    <OpenBook
      left={item.left !== null ? doc.pages[item.left] : null}
      right={item.right !== null ? doc.pages[item.right] : null}
      {...bookFinish(doc)}
      {...common}
    />
  );
}

/**
 * One page at a time (phones), turned like a real book: the same 3D page turn
 * as the open book on larger screens, showing only its right-hand page, so the
 * page swings over at the spine.
 */
function SinglePageFlip({ index, doc, photos, width, dir }: { index: number; doc: AlbumDocument; photos: PhotoMap; width: number; dir: 1 | -1 }) {
  const spread = { left: index > 0 ? doc.pages[index - 1] : null, right: doc.pages[index] };
  return (
    <div style={{ width, clipPath: 'inset(-12% -12% -12% 0)' }}>
      <div style={{ width: width * 2, marginLeft: -width }}>
        <FlipBook spread={spread} dir={dir} size={doc.size} photos={photos} renderWidth={width * 2} {...bookFinish(doc)} eager />
      </div>
    </div>
  );
}

export function AlbumViewer({ doc, photos, title, subtitle, backHref, backLabel = 'Back', actions, banner, presentation, animationPicker }: AlbumViewerProps) {
  const show = presentation ?? presentationOf(doc);
  const music = show.musicUrl;
  const [anim, setAnim] = useState<PageAnimation>(show.animation);
  const [opened, setOpened] = useState(!music);
  const [opening, setOpening] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [musicError, setMusicError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [mode, setMode] = useState<'spread' | 'single'>('spread');
  const items = useMemo(() => buildViewItems(doc.pages.length, mode), [doc.pages.length, mode]);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [zoom, setZoom] = useState(1);
  const [stage, setStage] = useState({ w: 900, h: 600 });
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const item = items[Math.min(index, items.length - 1)];

  useEffect(() => {
    // Narrow screens default to single pages.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.innerWidth < 700) setMode('single');
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const n = Math.max(0, Math.min(items.length - 1, i + delta));
        if (n !== i) setDir(delta > 0 ? 1 : -1);
        return n;
      });
      setZoom(1);
    },
    [items.length],
  );

  const goTo = (i: number) => {
    setDir(i >= index ? 1 : -1);
    setIndex(i);
    setZoom(1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
      else if (e.key === 'Home') goTo(0);
      else if (e.key === 'End') goTo(items.length - 1);
      else if (e.key === '+' || e.key === '=') setZoom((z) => ZOOMS.find((x) => x > z) ?? z);
      else if (e.key === '-') setZoom((z) => [...ZOOMS].reverse().find((x) => x < z) ?? z);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-idx="${index}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index, mode]);

  const switchMode = (next: 'spread' | 'single') => {
    if (next === mode) return;
    const cur = item;
    let target = 0;
    if (cur.kind === 'back') target = Infinity;
    else if (next === 'single') {
      if (cur.kind === 'spread') target = 1 + (cur.left ?? cur.right ?? 0);
    } else if (cur.kind === 'page') target = 1 + spreadIndexOfPage(cur.index);
    const nextItems = buildViewItems(doc.pages.length, next);
    setMode(next);
    setIndex(Math.min(nextItems.length - 1, target));
    setZoom(1);
  };

  /** The opening click is what lets the browser start the music. */
  const openAlbum = () => {
    const a = audioRef.current;
    if (a && !musicError) {
      a.volume = 0;
      a.play().then(() => fadeIn(a)).catch(() => {});
    }
    setOpening(true);
    window.setTimeout(() => {
      setOpened(true);
      setDir(1);
      setIndex((i) => (i === 0 && items.length > 1 ? 1 : i));
    }, 1300);
  };

  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.volume = 0;
      a.play().then(() => fadeIn(a, 0.85, 700)).catch(() => setMusicError(true));
    } else a.pause();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.();
  };

  const aspect = itemAspect(item, doc);
  const pad = stage.w < 640 ? 24 : 72;
  const fitW = Math.max(120, Math.min(stage.w - pad * 2, (stage.h - 48) * aspect));
  const width = fitW * zoom;
  const isCoverLike = item.kind === 'cover' || item.kind === 'back' || item.kind === 'page';
  const displayW = item.kind === 'spread' ? width : isCoverLike ? width : width;

  return (
    <div ref={rootRef} className="relative flex h-dvh flex-col overflow-hidden bg-[#140d0e] text-white">
      {/* a reading-room spotlight on the book, nothing more */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgb(255_255_255/0.07),transparent_70%)]" />
      {/* Top bar */}
      <div className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#140d0e]/80 px-3 backdrop-blur-md sm:px-5 [&_.btn-ghost]:text-white/80 [&_.btn-ghost:hover]:bg-white/10 [&_.btn-ghost:hover]:text-white">
        {backHref && (
          <Link href={backHref} className="btn btn-ghost btn-sm !px-2.5" aria-label={backLabel}>
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg leading-tight">{title}</p>
          {subtitle && <p className="hidden truncate text-xs text-white/50 sm:block">{subtitle}</p>}
        </div>
        <div className="hidden items-center rounded-full border border-white/15 bg-white/5 p-0.5 sm:flex" role="group" aria-label="View mode">
          <button type="button" onClick={() => switchMode('spread')} aria-pressed={mode === 'spread'} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${mode === 'spread' ? 'bg-white text-ink' : 'text-white/70 hover:text-white'}`}>
            <Columns2 size={14} /> Spreads
          </button>
          <button type="button" onClick={() => switchMode('single')} aria-pressed={mode === 'single'} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${mode === 'single' ? 'bg-white text-ink' : 'text-white/70 hover:text-white'}`}>
            <RectangleVertical size={14} /> Pages
          </button>
        </div>
        <div className="hidden items-center gap-0.5 md:flex" role="group" aria-label="Zoom">
          <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((z) => [...ZOOMS].reverse().find((x) => x < z) ?? 1)}>
            <Minus size={16} />
          </button>
          <button type="button" className="w-12 text-center text-xs tabular-nums text-white/70" onClick={() => setZoom(1)} title="Fit to screen">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((z) => ZOOMS.find((x) => x > z) ?? z)}>
            <Plus size={16} />
          </button>
        </div>
        {animationPicker && (
          <label className="hidden items-center gap-2 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-white/55 md:flex">
            Animation
            <span className="relative">
              <select
                value={anim}
                onChange={(e) => setAnim(e.target.value as PageAnimation)}
                className="h-8 cursor-pointer appearance-none rounded-[4px] border border-white/15 bg-white/5 py-0 pl-3 pr-8 text-xs normal-case tracking-normal text-white outline-none transition-colors hover:border-white/30 focus:border-white/40"
              >
                {ANIMATIONS.map((a) => (
                  <option key={a.id} value={a.id} className="text-ink">
                    {a.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70" />
            </span>
          </label>
        )}
        {music && (
          <button
            type="button"
            onClick={toggleMusic}
            disabled={musicError}
            aria-label={playing ? 'Pause music' : 'Play music'}
            title={musicError ? 'This music link can’t be played' : undefined}
            className="btn btn-ghost btn-sm !px-2.5 disabled:opacity-40"
          >
            <span className="eq flex h-3 items-end gap-[2px]" data-playing={playing}>
              <span />
              <span />
              <span />
            </span>
            <span className="hidden text-xs sm:inline">{musicError ? 'Music unavailable' : playing ? 'Music' : 'Music off'}</span>
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
          {fullscreen ? <Minimize size={17} /> : <Expand size={17} />}
        </button>
        {actions}
      </div>
      {banner}

      {/* Stage */}
      <div className="relative z-[1] min-h-0 flex-1">
        <div
          ref={stageRef}
          className={`absolute inset-0 ${zoom > 1 ? 'overflow-auto' : 'overflow-hidden'} ${show.livingPhotos ? 'living' : ''}`}
          onPointerDown={(e) => {
            if (zoom === 1) swipe.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
          }}
          onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
        >
          <div className="flex min-h-full min-w-full items-center justify-center p-6" style={{ width: zoom > 1 ? width + pad * 2 : undefined }}>
            {item.kind === 'spread' && anim === 'flip' ? (
              <div key="spread-book" className="viewer-turn" data-dir={dir} style={{ width: displayW }}>
                <FlipBook
                  spread={{ left: item.left !== null ? doc.pages[item.left] : null, right: item.right !== null ? doc.pages[item.right] : null }}
                  dir={dir}
                  size={doc.size}
                  photos={photos}
                  renderWidth={displayW}
                  {...bookFinish(doc)}
                  eager
                />
              </div>
            ) : item.kind === 'page' && anim === 'flip' ? (
              <div key="single-book" className="viewer-turn" data-dir={dir} style={{ width: displayW }}>
                <SinglePageFlip index={item.index} doc={doc} photos={photos} width={displayW} dir={dir} />
              </div>
            ) : (
              <div key={`${mode}-${index}-${anim}`} className={anim === 'flip' ? 'viewer-turn' : `pa pa-${anim}`} data-dir={dir} style={{ width: displayW }}>
                <ItemView item={item} doc={doc} photos={photos} width={displayW} eager />
              </div>
            )}
          </div>
        </div>
        {/* Preload neighbours */}
        <div aria-hidden className="pointer-events-none absolute -left-[9999px] top-0 opacity-0" style={{ width: displayW }}>
          {[items[index - 1], items[index + 1]].filter(Boolean).map((it, i) => (
            <ItemView key={i} item={it!} doc={doc} photos={photos} width={displayW} eager />
          ))}
        </div>
        <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous" className="absolute left-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-ink disabled:opacity-0 sm:left-6">
          <ChevronLeft size={20} />
        </button>
        <button type="button" onClick={() => go(1)} disabled={index === items.length - 1} aria-label="Next" className="absolute right-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-ink disabled:opacity-0 sm:right-6">
          <ChevronRight size={20} />
        </button>
        <p aria-live="polite" className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-xs tracking-wide text-white/80 backdrop-blur-md">
          {itemLabel(item, doc.pages.length)}
        </p>
      </div>

      {/* Thumbnails */}
      <div ref={stripRef} className="no-scrollbar relative z-10 flex h-[6.5rem] shrink-0 items-center gap-3 overflow-x-auto border-t border-white/10 bg-night/60 px-4 backdrop-blur-xl" aria-label="Pages">
        {items.map((it, i) => {
          const a = itemAspect(it, doc);
          const h = 64;
          return (
            <button
              key={i}
              type="button"
              data-idx={i}
              onClick={() => goTo(i)}
              aria-label={itemLabel(it, doc.pages.length)}
              aria-current={i === index ? 'true' : undefined}
              className={`shrink-0 rounded-[3px] p-0.5 transition duration-300 ${i === index ? 'scale-105 ring-2 ring-accent' : 'opacity-50 hover:opacity-100'}`}
              style={{ width: h * a + 4 }}
            >
              {it.kind === 'spread' ? (
                <div className="flex">
                  {[it.left, it.right].map((p, k) => (
                    <div key={k} className="flex-1">
                      {p !== null ? <FlatPage page={doc.pages[p]} size={doc.size} photos={photos} renderWidth={80} className="!rounded-none !shadow-none" /> : <div style={{ aspectRatio: `${doc.size.widthMm}/${doc.size.heightMm}` }} className="bg-white/10" />}
                    </div>
                  ))}
                </div>
              ) : (
                <FlatPage page={it.kind === 'cover' ? doc.cover : it.kind === 'back' ? doc.backCover : doc.pages[it.index]} size={doc.size} photos={photos} renderWidth={80} className="!rounded-none !shadow-none" />
              )}
            </button>
          );
        })}
      </div>
      <span className="sr-only">
        <BookOpen /> Use the left and right arrow keys to turn pages.
      </span>

      {music && (
        <audio
          ref={audioRef}
          src={music}
          loop
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => {
            setMusicError(true);
            setPlaying(false);
          }}
        />
      )}

      {/* Overture: the closed book on cloth; opening it starts the music */}
      {!opened && (
        <div className={`cloth absolute inset-0 z-50 grid place-items-center overflow-hidden px-6 text-center ${opening ? 'overture-out' : ''}`}>
          <div>
            <div className="mx-auto w-[min(17rem,62vw)]">
              <div className={opening ? 'cover-opening' : 'book-in'}>
                <div className="shadow-[0_40px_60px_-30px_rgb(0_0_0/.65)]">
                  <BookCover page={doc.cover} size={doc.size} photos={photos} renderWidth={320} eager />
                </div>
              </div>
            </div>
            <p className="smallcaps mt-10 !text-white/60">{subtitle ?? 'A FULLSTORY album'}</p>
            <h1 className="mt-3 font-serif text-4xl font-medium leading-tight md:text-5xl">{title}</h1>
            <button
              type="button"
              autoFocus
              onClick={openAlbum}
              disabled={opening}
              className="btn btn-light btn-lg mt-9 text-[0.75rem] uppercase tracking-[0.2em]"
            >
              Open the album
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/55">
              <span className="eq flex h-3 items-end gap-[2px]" data-playing="true">
                <span />
                <span />
                <span />
              </span>
              Best with sound on
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
