'use client';

import { useEffect, useRef, useState } from 'react';
import { sameRef, pageAt } from '@/lib/album/ops';
import type { PageRef } from '@/lib/album/types';
import { EditablePage } from './EditablePage';
import { refLabel, useEditor, visibleRefs } from './store';

export function AlbumCanvas({ safeMarginMm }: { safeMarginMm: number }) {
  const doc = useEditor((s) => s.doc);
  const active = useEditor((s) => s.active);
  const viewMode = useEditor((s) => s.viewMode);
  const zoom = useEditor((s) => s.zoom);
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const refs = visibleRefs(doc, active, viewMode);
  const cols = refs.length;
  const aspect = doc.size.widthMm / doc.size.heightMm;
  const padX = box.w < 700 ? 24 : 64;
  const padY = 72;
  const fitW = Math.max(160, Math.min((box.w - padX * 2) / cols, (box.h - padY * 2) * aspect));
  const pageW = Math.round(fitW * zoom);

  return (
    <div
      ref={ref}
      className="relative min-h-0 flex-1 overflow-auto bg-editor scrollbar-thin"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg) {
          const s = useEditor.getState();
          s.setEditingText(null);
          s.setCropping(null);
          s.select(null);
        }
      }}
    >
      <div data-canvas-bg="1" className="flex min-h-full min-w-full items-center justify-center" style={{ padding: `${padY}px ${padX}px`, width: pageW * cols + padX * 2 > box.w ? pageW * cols + padX * 2 : undefined }}>
        <div data-canvas-bg="1" className="relative flex">
          {refs.map((r, i) =>
            r ? (
              <PageSlot key={JSON.stringify(r)} pageRef={r} widthPx={pageW} safeMarginMm={safeMarginMm} isActive={sameRef(r, active)} side={cols === 2 ? (i === 0 ? 'left' : 'right') : 'single'} />
            ) : (
              <div key={`empty-${i}`} style={{ width: pageW, height: pageW / aspect }} className="grid place-items-center bg-[#e2e2e9]">
                <span className="text-xs uppercase tracking-[0.16em] text-faint">{i === 0 ? 'Inside cover' : 'Inside back cover'}</span>
              </div>
            ),
          )}
          {cols === 2 && <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[3%] -translate-x-1/2 spread-gutter opacity-60" />}
        </div>
      </div>
    </div>
  );
}

function PageSlot({ pageRef, widthPx, safeMarginMm, isActive, side }: { pageRef: PageRef; widthPx: number; safeMarginMm: number; isActive: boolean; side: 'left' | 'right' | 'single' }) {
  const page = useEditor((s) => pageAt(s.doc, pageRef));
  if (!page) return null;
  return (
    <div className="relative" onPointerDownCapture={() => !isActive && useEditor.getState().setActive(pageRef)}>
      <p className={`absolute -top-7 text-[11px] uppercase tracking-[0.16em] ${isActive ? 'text-ink-soft' : 'text-faint'} ${side === 'right' ? 'right-0' : 'left-0'}`}>{refLabel(pageRef)}</p>
      <EditablePage pageRef={pageRef} page={page} widthPx={widthPx} safeMarginMm={safeMarginMm} isActive={isActive} />
    </div>
  );
}
