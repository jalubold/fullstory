'use client';

import { memo, useMemo } from 'react';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { PageView } from '@/components/album/PageView';
import { buildSpreads } from '@/lib/album/geometry';
import { addPages, movePage, sameRef } from '@/lib/album/ops';
import type { Page, PageRef, PageSize, PhotoMap } from '@/lib/album/types';
import { useEditor } from './store';

const THUMB_H = 58;

const Thumb = memo(function Thumb({ page, size, photos }: { page: Page; size: PageSize; photos: PhotoMap }) {
  return <PageView page={page} size={size} photos={photos} renderWidth={90} emptyFrames="placeholder" />;
});

export function PageNavigator() {
  const doc = useEditor((s) => s.doc);
  const photos = useEditor((s) => s.photoMap);
  const active = useEditor((s) => s.active);
  const setActive = useEditor((s) => s.setActive);
  const aspect = doc.size.widthMm / doc.size.heightMm;
  const w = THUMB_H * aspect;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = useMemo(() => doc.pages.map((p) => p.id), [doc.pages]);
  const spreads = buildSpreads(doc.pages.length);

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    useEditor.getState().apply((d) => movePage(d, from, to));
    setActive({ kind: 'page', index: to });
  };

  const addSpread = () => {
    const after = active.kind === 'page' ? active.index : doc.pages.length - 1;
    let idx = 0;
    useEditor.getState().apply((d) => {
      idx = addPages(d, after, 2);
    });
    setActive({ kind: 'page', index: idx });
    useEditor.getState().toast('Two pages added');
  };

  const isActive = (r: PageRef) => sameRef(r, active);
  const spreadStart = (i: number) => spreads.some((s) => s.left === i);

  return (
    <div className="flex h-[92px] shrink-0 items-center gap-2 border-t border-line bg-white px-3">
      <div className="no-scrollbar flex flex-1 items-center gap-0 overflow-x-auto py-2" role="listbox" aria-label="Pages">
        <NavItem label="Cover" ariaLabel="Front cover" active={isActive({ kind: 'cover' })} onClick={() => setActive({ kind: 'cover' })} width={w}>
          <Thumb page={doc.cover} size={doc.size} photos={photos} />
        </NavItem>
        <span className="w-4 shrink-0" />
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
            {doc.pages.map((p, i) => (
              <SortablePage key={p.id} id={p.id} index={i} width={w} gapBefore={i > 0 && spreadStart(i)} active={isActive({ kind: 'page', index: i })} onClick={() => setActive({ kind: 'page', index: i })}>
                <Thumb page={p} size={doc.size} photos={photos} />
              </SortablePage>
            ))}
          </SortableContext>
        </DndContext>
        <span className="w-4 shrink-0" />
        <NavItem label="Back" ariaLabel="Back cover" active={isActive({ kind: 'back' })} onClick={() => setActive({ kind: 'back' })} width={w}>
          <Thumb page={doc.backCover} size={doc.size} photos={photos} />
        </NavItem>
      </div>
      <button type="button" onClick={addSpread} className="btn btn-secondary btn-sm shrink-0" title="Add two pages after the current page">
        <Plus size={15} /> <span className="hidden md:inline">Add pages</span>
      </button>
    </div>
  );
}

function NavItem({ label, ariaLabel, active, onClick, width, children }: { label: string; ariaLabel?: string; active: boolean; onClick: () => void; width: number; children: React.ReactNode }) {
  return (
    <button type="button" role="option" aria-selected={active} aria-label={ariaLabel ?? label} onClick={onClick} className="group flex shrink-0 flex-col items-center gap-1">
      <span aria-hidden className={`block overflow-hidden rounded-[2px] ring-offset-1 transition ${active ? 'ring-2 ring-accent' : 'ring-1 ring-line-strong group-hover:ring-ink/40'}`} style={{ width }}>
        {children}
      </span>
      <span className={`text-[10px] ${active ? 'text-ink' : 'text-muted'}`}>{label}</span>
    </button>
  );
}

function SortablePage({ id, index, width, active, gapBefore, onClick, children }: { id: string; index: number; width: number; active: boolean; gapBefore: boolean; onClick: () => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, marginLeft: gapBefore ? 10 : 0 }}
      className={`shrink-0 ${isDragging ? 'opacity-70' : ''}`}
      {...attributes}
      {...listeners}
    >
      <NavItem label={String(index + 1)} ariaLabel={`Page ${index + 1}`} active={active} onClick={onClick} width={width}>
        {children}
      </NavItem>
    </div>
  );
}
