'use client';

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import { Check, RotateCcw, ZoomIn } from 'lucide-react';
import { displayText, elementBoxStyle, PageView, textStyle } from '@/components/album/PageView';
import { clamp, computeCrop, pageSizePt, panCrop } from '@/lib/album/geometry';
import { addPhotoFrame, pageAt, sameRef } from '@/lib/album/ops';
import { photoUrl } from '@/lib/album/photos';
import type { AlbumElement, Page, PageRef, PhotoElement, TextElement } from '@/lib/album/types';
import { useEditor } from './store';

const PHOTO_MIME = 'application/x-fs-photo';

interface Guides {
  x: number[];
  y: number[];
}

type Handle = { sx: -1 | 0 | 1; sy: -1 | 0 | 1; cursor: string };
const HANDLES: Handle[] = [
  { sx: -1, sy: -1, cursor: 'nwse-resize' },
  { sx: 0, sy: -1, cursor: 'ns-resize' },
  { sx: 1, sy: -1, cursor: 'nesw-resize' },
  { sx: 1, sy: 0, cursor: 'ew-resize' },
  { sx: 1, sy: 1, cursor: 'nwse-resize' },
  { sx: 0, sy: 1, cursor: 'ns-resize' },
  { sx: -1, sy: 1, cursor: 'nesw-resize' },
  { sx: -1, sy: 0, cursor: 'ew-resize' },
];

export interface EditablePageProps {
  pageRef: PageRef;
  page: Page;
  widthPx: number;
  safeMarginMm: number;
  isActive: boolean;
}

export const EditablePage = memo(function EditablePage({ pageRef, page, widthPx, safeMarginMm, isActive }: EditablePageProps) {
  const doc = useEditor((s) => s.doc);
  const photoMap = useEditor((s) => s.photoMap);
  const selectedId = useEditor((s) => (sameRef(s.active, pageRef) ? s.selectedId : null));
  const editingTextId = useEditor((s) => s.editingTextId);
  const croppingId = useEditor((s) => s.croppingId);
  const dragPhotoId = useEditor((s) => s.dragPhotoId);
  const rootRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Guides>({ x: [], y: [] });
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const size = doc.size;
  const heightPx = (widthPx * size.heightMm) / size.widthMm;
  const { w: Wpt } = pageSizePt(size);
  const selected = page.elements.find((e) => e.id === selectedId) ?? null;
  const hidden = useMemo(() => (editingTextId && page.elements.some((e) => e.id === editingTextId) ? new Set([editingTextId]) : undefined), [editingTextId, page.elements]);

  const st = useEditor.getState;

  /* ------------------------------- dragging ------------------------------- */
  const startMove = (e: RPointerEvent, el: AlbumElement) => {
    e.stopPropagation();
    const s = st();
    if (!sameRef(s.active, pageRef) || s.selectedId !== el.id) s.select(el.id, pageRef);
    if (s.editingTextId === el.id || s.croppingId === el.id) return;
    if (e.button !== 0 || el.locked) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const x0 = el.x;
    const y0 = el.y;
    let moved = false;
    const others = page.elements.filter((o) => o.id !== el.id);
    const safeX = safeMarginMm / size.widthMm;
    const safeY = safeMarginMm / size.heightMm;
    const tx = [0, 0.5, 1, safeX, 1 - safeX, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
    const ty = [0, 0.5, 1, safeY, 1 - safeY, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      if (!moved) {
        moved = true;
        st().beginGesture();
      }
      let nx = x0 + dx / widthPx;
      let ny = y0 + dy / heightPx;
      const g: Guides = { x: [], y: [] };
      if (!ev.altKey) {
        const snap = (pos: number, size: number, targets: number[], px: number) => {
          const tol = 6 / px;
          let best: { d: number; to: number; at: number } | null = null;
          for (const [k, edge] of [0, 0.5, 1].entries()) {
            const v = pos + size * edge;
            for (const t of targets) {
              const d = Math.abs(t - v);
              if (d < tol && (!best || d < best.d)) best = { d, to: t - size * [0, 0.5, 1][k], at: t };
            }
          }
          return best;
        };
        const sx = snap(nx, el.w, tx, widthPx);
        const sy = snap(ny, el.h, ty, heightPx);
        if (sx) {
          nx = sx.to;
          g.x.push(sx.at);
        }
        if (sy) {
          ny = sy.to;
          g.y.push(sy.at);
        }
      }
      setGuides(g);
      st().updateElement(pageRef, el.id, { x: nx, y: ny });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setGuides({ x: [], y: [] });
      if (moved) st().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResize = (e: RPointerEvent, el: AlbumElement, h: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const th = (el.rotation * Math.PI) / 180;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const w0 = el.w * widthPx;
    const h0 = el.h * heightPx;
    const c0x = el.x * widthPx + w0 / 2;
    const c0y = el.y * heightPx + h0 / 2;
    const keepAspect = el.type === 'ornament';
    st().beginGesture();
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const ldx = dx * cos + dy * sin;
      const ldy = -dx * sin + dy * cos;
      let nw = Math.max(12, w0 + h.sx * ldx);
      let nh = el.type === 'shape' && el.shape === 'line' ? h0 : Math.max(12, h0 + h.sy * ldy);
      if ((keepAspect || ev.shiftKey) && h.sx && h.sy) {
        const k = Math.max(nw / w0, nh / h0);
        nw = w0 * k;
        nh = h0 * k;
      }
      const lsx = (h.sx * (nw - w0)) / 2;
      const lsy = (h.sy * (nh - h0)) / 2;
      const cx = c0x + lsx * cos - lsy * sin;
      const cy = c0y + lsx * sin + lsy * cos;
      st().updateElement(pageRef, el.id, { x: (cx - nw / 2) / widthPx, y: (cy - nh / 2) / heightPx, w: nw / widthPx, h: nh / heightPx });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      st().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startRotate = (e: RPointerEvent, el: AlbumElement) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = rootRef.current!.getBoundingClientRect();
    const cx = rect.left + (el.x + el.w / 2) * widthPx;
    const cy = rect.top + (el.y + el.h / 2) * heightPx;
    st().beginGesture();
    const onMove = (ev: PointerEvent) => {
      let deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      if (deg > 180) deg -= 360;
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      else {
        const near = Math.round(deg / 45) * 45;
        if (Math.abs(near - deg) < 3) deg = near;
      }
      st().updateElement(pageRef, el.id, { rotation: Math.round(deg * 10) / 10 });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      st().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  /* ------------------------------ drop targets ----------------------------- */
  const photoFromEvent = (e: React.DragEvent) => e.dataTransfer.getData(PHOTO_MIME) || st().dragPhotoId;
  const acceptsPhoto = (e: React.DragEvent) => e.dataTransfer.types.includes(PHOTO_MIME) || !!st().dragPhotoId;

  const dropOnFrame = (e: React.DragEvent, el: PhotoElement) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    const id = photoFromEvent(e);
    if (!id) return;
    st().updateElement(pageRef, el.id, (d) => {
      const p = d as PhotoElement;
      p.photoId = id;
      p.crop = { zoom: 1, fx: 0.5, fy: 0.5 };
    });
    st().select(el.id, pageRef);
    st().setDragPhoto(null);
  };

  const dropOnPage = (e: React.DragEvent) => {
    if (!acceptsPhoto(e)) return;
    e.preventDefault();
    setDropTarget(null);
    const id = photoFromEvent(e);
    const asset = id ? st().photoMap[id] : undefined;
    if (!asset) return;
    const rect = rootRef.current!.getBoundingClientRect();
    const at = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    let newId = '';
    st().apply((d) => {
      const pg = pageAt(d, pageRef);
      if (pg) newId = addPhotoFrame(d, pg, asset, at).id;
    });
    st().select(newId, pageRef);
    st().setDragPhoto(null);
  };

  const safeX = (safeMarginMm / size.widthMm) * 100;
  const safeY = (safeMarginMm / size.heightMm) * 100;

  return (
    <div
      ref={rootRef}
      data-active-page={isActive ? 'true' : undefined}
      className={`relative select-none bg-white shadow-[0_1px_3px_rgb(0_0_0/.08),0_12px_32px_-12px_rgb(37_35_31/.25)] ${isActive ? 'ring-2 ring-accent/60' : ''}`}
      style={{ width: widthPx, height: heightPx, containerType: 'inline-size' }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.bg) {
          const s = st();
          if (s.editingTextId || s.croppingId) {
            s.setEditingText(null);
            s.setCropping(null);
          }
          s.setActive(pageRef, null);
        }
      }}
      onDragOver={(e) => {
        if (acceptsPhoto(e)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={dropOnPage}
    >
      <PageView page={page} size={size} photos={photoMap} renderWidth={widthPx} emptyFrames="drop-target" hiddenIds={hidden} eager />
      <div data-bg="1" className="absolute inset-0">
        {isActive && (
          <div
            aria-hidden
            className="pointer-events-none absolute border border-dashed border-[#d06b5a]/35"
            style={{ left: `${safeX}%`, right: `${safeX}%`, top: `${safeY}%`, bottom: `${safeY}%` }}
          />
        )}
        {page.elements.map((el) => (
          <div
            key={el.id}
            role="button"
            tabIndex={-1}
            aria-label={`${el.type} element`}
            className={`absolute ${el.locked ? 'cursor-default' : 'cursor-move'} ${dropTarget === el.id ? 'outline outline-2 outline-accent' : ''} hover:outline hover:outline-1 hover:outline-accent/50`}
            style={{ ...elementBoxStyle(el), touchAction: 'none' }}
            onPointerDown={(e) => startMove(e, el)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (el.type === 'text') st().setEditingText(el.id);
              else if (el.type === 'photo' && el.photoId) st().setCropping(el.id);
            }}
            onDragOver={
              el.type === 'photo'
                ? (e) => {
                    if (!acceptsPhoto(e)) return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy';
                    if (dropTarget !== el.id) setDropTarget(el.id);
                  }
                : undefined
            }
            onDragLeave={el.type === 'photo' ? () => setDropTarget((t) => (t === el.id ? null : t)) : undefined}
            onDrop={el.type === 'photo' ? (e) => dropOnFrame(e, el) : undefined}
          >
            {el.type === 'photo' && !el.photoId && dragPhotoId && <span className="absolute inset-0 grid place-items-center bg-accent/10 text-[11px] font-medium text-accent-dark">Drop here</span>}
          </div>
        ))}
        {guides.x.map((x, i) => (
          <div key={`gx${i}`} className="pointer-events-none absolute inset-y-0 w-px bg-[#e0533d]" style={{ left: `${x * 100}%` }} />
        ))}
        {guides.y.map((y, i) => (
          <div key={`gy${i}`} className="pointer-events-none absolute inset-x-0 h-px bg-[#e0533d]" style={{ top: `${y * 100}%` }} />
        ))}
        {selected && editingTextId !== selected.id && croppingId !== selected.id && (
          <SelectionFrame el={selected} onResize={startResize} onRotate={startRotate} />
        )}
        {selected?.type === 'text' && editingTextId === selected.id && <InlineTextEditor el={selected} pageRef={pageRef} Wpt={Wpt} />}
        {selected?.type === 'photo' && croppingId === selected.id && selected.photoId && photoMap[selected.photoId] && (
          <CropOverlay el={selected} pageRef={pageRef} widthPx={widthPx} heightPx={heightPx} Wpt={Wpt} />
        )}
      </div>
    </div>
  );
});

function SelectionFrame({
  el,
  onResize,
  onRotate,
}: {
  el: AlbumElement;
  onResize: (e: RPointerEvent, el: AlbumElement, h: Handle) => void;
  onRotate: (e: RPointerEvent, el: AlbumElement) => void;
}) {
  const isLine = el.type === 'shape' && el.shape === 'line';
  const handles = isLine ? HANDLES.filter((h) => h.sy === 0) : HANDLES;
  return (
    <div className="pointer-events-none absolute outline outline-[1.5px] outline-accent" style={elementBoxStyle(el)}>
      {!el.locked &&
        handles.map((h) => (
          <span
            key={`${h.sx}${h.sy}`}
            className="pointer-events-auto absolute h-[11px] w-[11px] rounded-[3px] border-[1.5px] border-accent bg-white shadow-sm"
            style={{
              left: `${(h.sx + 1) * 50}%`,
              top: `${(h.sy + 1) * 50}%`,
              transform: 'translate(-50%, -50%)',
              cursor: h.cursor,
              touchAction: 'none',
            }}
            onPointerDown={(e) => onResize(e, el, h)}
          />
        ))}
      {!el.locked && (
        <>
          <span className="absolute left-1/2 top-0 h-5 w-px -translate-y-full bg-accent" />
          <span
            title="Rotate"
            className="pointer-events-auto absolute left-1/2 top-0 grid h-4 w-4 -translate-x-1/2 -translate-y-[calc(100%+18px)] cursor-grab place-items-center rounded-full border-[1.5px] border-accent bg-white"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => onRotate(e, el)}
          >
            <RotateCcw size={9} className="text-accent-dark" />
          </span>
        </>
      )}
    </div>
  );
}

function InlineTextEditor({ el, pageRef, Wpt }: { el: TextElement; pageRef: PageRef; Wpt: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerText = el.text;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // Initialise once; afterwards the DOM is the source of truth while editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el.id]);
  const style: CSSProperties = { ...textStyle(el, Wpt), textTransform: el.uppercase ? 'uppercase' : undefined, outline: 'none', minHeight: '1em', cursor: 'text' };
  return (
    <div
      className="absolute flex flex-col outline outline-[1.5px] outline-dashed outline-accent"
      style={{
        ...elementBoxStyle(el),
        justifyContent: el.valign === 'top' ? 'flex-start' : el.valign === 'bottom' ? 'flex-end' : 'center',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        ref={ref}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        spellCheck
        style={{ ...style, fontSize: `${(el.size / Wpt) * 100}cqw` }}
        onInput={(e) => {
          const text = (e.currentTarget.innerText ?? '').replace(/\n$/, '');
          useEditor.getState().updateElement(pageRef, el.id, { text }, { key: `text:${el.id}` });
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
            e.preventDefault();
            useEditor.getState().setEditingText(null);
          }
        }}
        onBlur={() => useEditor.getState().setEditingText(null)}
      />
    </div>
  );
}

function CropOverlay({ el, pageRef, widthPx, heightPx, Wpt }: { el: PhotoElement; pageRef: PageRef; widthPx: number; heightPx: number; Wpt: number }) {
  const asset = useEditor((s) => s.photoMap[el.photoId!]);
  const frameWpx = el.w * widthPx;
  const frameHpx = el.h * heightPx;
  const bwPx = (el.borderWidth / Wpt) * widthPx;
  const innerW = frameWpx - bwPx * 2;
  const innerH = frameHpx - bwPx * 2;
  const c = computeCrop(asset.width, asset.height, innerW, innerH, el.crop);
  const st = useEditor.getState;
  const [, force] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') st().setCropping(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st]);

  const startPan = (e: RPointerEvent) => {
    e.stopPropagation();
    const th = (el.rotation * Math.PI) / 180;
    const sx = e.clientX;
    const sy = e.clientY;
    const crop0 = el.crop;
    st().beginGesture();
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      const ldx = dx * Math.cos(th) + dy * Math.sin(th);
      const ldy = -dx * Math.sin(th) + dy * Math.cos(th);
      st().updateElement(pageRef, el.id, { crop: panCrop(asset.width, asset.height, innerW, innerH, crop0, ldx / innerW, ldy / innerH) } as Partial<PhotoElement>);
      force((n) => n + 1);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      st().endGesture();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const setZoom = (zoom: number) => st().updateElement(pageRef, el.id, { crop: { ...el.crop, zoom: clamp(zoom, 1, 5) } } as Partial<PhotoElement>, { key: `zoom:${el.id}` });

  return (
    <div className="absolute" style={elementBoxStyle(el)} onPointerDown={(e) => e.stopPropagation()}>
      <div className="absolute" style={{ inset: bwPx }}>
        <img
          src={photoUrl(asset, innerW * c.relW * 2)}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none opacity-40"
          style={{ left: `${c.relX * 100}%`, top: `${c.relY * 100}%`, width: `${c.relW * 100}%`, height: `${c.relH * 100}%` }}
        />
        <div
          className="absolute inset-0 cursor-grab outline outline-2 outline-accent active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={startPan}
          onWheel={(e) => {
            e.preventDefault();
            setZoom(el.crop.zoom * Math.pow(1.0015, -e.deltaY));
          }}
        />
      </div>
      <div
        className="absolute left-1/2 top-full z-10 mt-3 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-paper shadow-pop"
        style={{ transform: `translateX(-50%) rotate(${-el.rotation}deg)` }}
      >
        <ZoomIn size={14} />
        <input type="range" min={1} max={5} step={0.01} value={el.crop.zoom} onChange={(e) => setZoom(+e.target.value)} className="w-28 accent-[#a68c70]" aria-label="Zoom photo" />
        <button type="button" className="rounded-full px-2 py-0.5 text-xs hover:bg-white/10" onClick={() => st().updateElement(pageRef, el.id, { crop: { zoom: 1, fx: 0.5, fy: 0.5 } } as Partial<PhotoElement>)}>
          Reset
        </button>
        <button type="button" className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs" onClick={() => st().setCropping(null)}>
          <Check size={12} /> Done
        </button>
      </div>
    </div>
  );
}

export { PHOTO_MIME, displayText };
