'use client';

import type { ReactNode } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  AlertTriangle,
  BringToFront,
  Copy,
  Crop,
  ImageMinus,
  Lock,
  LockOpen,
  Replace,
  SendToBack,
  Trash2,
  X,
} from 'lucide-react';
import { availableWeights, cssFontStack, FONT_LIST, hasItalic, type FontId } from '@/lib/album/fonts';
import { effectiveDpi, pageSizePt } from '@/lib/album/geometry';
import { deletePage, duplicateElement, duplicatePage, pageAt, removeElement, reorderElement } from '@/lib/album/ops';
import type { AlbumElement, OrnamentElement, PhotoElement, ShapeElement, TextElement } from '@/lib/album/types';
import { ColorSwatches } from './EditorSidebar';
import { refLabel, useEditor } from './store';

const WEIGHT_LABEL: Record<number, string> = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold' };

export function PropertiesPanel({ minDpi }: { minDpi: number }) {
  const doc = useEditor((s) => s.doc);
  const active = useEditor((s) => s.active);
  const selectedId = useEditor((s) => s.selectedId);
  const setPropsOpen = useEditor((s) => s.setPropsOpen);
  const page = pageAt(doc, active);
  const el = page?.elements.find((e) => e.id === selectedId);

  return (
    <aside aria-label="Properties" className="h-full w-[288px] shrink-0 overflow-y-auto border-l border-line bg-white scrollbar-thin">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-5 py-3.5 backdrop-blur">
        <p className="font-serif text-xl">{el ? TYPE_LABEL[el.type] : refLabel(active)}</p>
        <button type="button" className="btn btn-ghost btn-sm !p-1.5 xl:hidden" onClick={() => setPropsOpen(false)} aria-label="Close properties">
          <X size={16} />
        </button>
      </div>
      <div className="space-y-7 p-5">
        {el ? (
          <>
            {el.type === 'photo' && <PhotoProps el={el} minDpi={minDpi} />}
            {el.type === 'text' && <TextProps el={el} />}
            {el.type === 'shape' && <ShapeProps el={el} />}
            {el.type === 'ornament' && <OrnamentProps el={el} />}
            <Arrange el={el} />
          </>
        ) : (
          <PageProps />
        )}
      </div>
    </aside>
  );
}

const TYPE_LABEL: Record<AlbumElement['type'], string> = { photo: 'Photo', text: 'Text', shape: 'Shape', ornament: 'Decoration' };

function useUpdate<T extends AlbumElement>(el: T) {
  return (patch: Partial<T>, key?: string) => {
    const s = useEditor.getState();
    s.updateElement(s.active, el.id, patch as Partial<AlbumElement>, key ? { key: `${key}:${el.id}` } : undefined);
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="eyebrow mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs text-ink-soft">
        {label}
        <span className="tabular-nums text-muted">
          {Number.isInteger(step) ? Math.round(value) : value.toFixed(step < 0.1 ? 2 : 1)}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-1.5 w-full accent-[#3a47ff]" />
    </label>
  );
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: Array<{ id: T; label: ReactNode; title?: string }>; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg bg-paper p-0.5">
      {options.map((o) => (
        <button key={o.id} type="button" title={o.title} aria-pressed={value === o.id} onClick={() => onChange(o.id)} className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs ${value === o.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PhotoProps({ el, minDpi }: { el: PhotoElement; minDpi: number }) {
  const doc = useEditor((s) => s.doc);
  const asset = useEditor((s) => (el.photoId ? s.photoMap[el.photoId] : undefined));
  const update = useUpdate(el);
  const { w: Wpt, h: Hpt } = pageSizePt(doc.size);
  const dpi = asset ? effectiveDpi(asset.width, asset.height, el.w * Wpt - el.borderWidth * 2, el.h * Hpt - el.borderWidth * 2, el.crop) : null;
  const s = useEditor.getState();
  return (
    <>
      <Section title="Photo">
        {asset ? (
          <>
            <div className="flex gap-3">
              <img src={asset.thumbUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 text-xs text-muted">
                <p className="truncate text-ink">{asset.alt}</p>
                <p>{asset.width} × {asset.height}px</p>
                {dpi !== null && (
                  <p className={dpi < minDpi ? 'mt-1 flex items-center gap-1 text-warning' : 'mt-1 text-success'}>
                    {dpi < minDpi ? <AlertTriangle size={12} /> : null}
                    {dpi < minDpi ? `Low resolution for print (${Math.round(dpi)} dpi)` : `Print quality: good (${Math.round(dpi)} dpi)`}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => s.setCropping(el.id)}>
                <Crop size={14} /> Crop
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => s.setPanel('photos')}>
                <Replace size={14} /> Replace
              </button>
            </div>
            <Slider label="Zoom" value={el.crop.zoom} min={1} max={5} step={0.01} unit="×" onChange={(v) => update({ crop: { ...el.crop, zoom: v } }, 'zoom')} />
            <button type="button" className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline" onClick={() => update({ photoId: null })}>
              <ImageMinus size={12} className="mr-1 inline" /> Remove photo from frame
            </button>
          </>
        ) : (
          <div className="rounded-xl bg-paper p-4 text-sm text-ink-soft">
            Empty frame. Drag a photo here from the Photos panel, or click a photo to place it.
            <button type="button" className="btn btn-primary btn-sm mt-3 w-full" onClick={() => s.setPanel('photos')}>
              Choose a photo
            </button>
          </div>
        )}
      </Section>
      <Section title="Filter">
        <Seg value={el.filter} onChange={(v) => update({ filter: v })} options={[{ id: 'none', label: 'Original' }, { id: 'bw', label: 'B&W' }, { id: 'sepia', label: 'Sepia' }]} />
      </Section>
      <Section title="Frame">
        <Seg value={el.shape} onChange={(v) => update({ shape: v })} options={[{ id: 'rect', label: 'Rectangle' }, { id: 'ellipse', label: 'Oval' }]} />
        {el.shape === 'rect' && <Slider label="Corner radius" value={el.radius} min={0} max={60} step={1} unit="pt" onChange={(v) => update({ radius: v }, 'radius')} />}
        <Slider label="Border" value={el.borderWidth} min={0} max={30} step={0.5} unit="pt" onChange={(v) => update({ borderWidth: v }, 'border')} />
        {el.borderWidth > 0 && <ColorSwatches value={el.borderColor} onChange={(c) => update({ borderColor: c })} colors={['#FFFFFF', '#F5F0E8', '#25231F', ...doc.theme.palette]} />}
      </Section>
    </>
  );
}

function TextProps({ el }: { el: TextElement }) {
  const doc = useEditor((s) => s.doc);
  const update = useUpdate(el);
  const weights = availableWeights(el.font);
  return (
    <>
      <Section title="Text">
        <textarea value={el.text} onChange={(e) => update({ text: e.target.value }, 'text')} rows={Math.min(8, Math.max(2, el.text.split('\n').length + 1))} className="input input-sm resize-y" aria-label="Text content" />
        <select
          value={el.font}
          onChange={(e) => {
            const font = e.target.value as FontId;
            const ws = availableWeights(font);
            const weight = ws.reduce((b, w) => (Math.abs(w - el.weight) < Math.abs(b - el.weight) ? w : b), ws[0]);
            update({ font, weight, italic: el.italic && hasItalic(font) });
          }}
          className="input input-sm"
          aria-label="Font"
          style={{ fontFamily: cssFontStack(el.font) }}
        >
          {FONT_LIST.map((f) => (
            <option key={f.id} value={f.id} style={{ fontFamily: cssFontStack(f.id) }}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select value={el.weight} onChange={(e) => update({ weight: +e.target.value })} className="input input-sm" aria-label="Weight">
            {weights.map((w) => (
              <option key={w} value={w}>
                {WEIGHT_LABEL[w] ?? w}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 text-xs" title={hasItalic(el.font) ? 'Italic' : 'No italic for this font'}>
            <input type="checkbox" checked={el.italic} disabled={!hasItalic(el.font)} onChange={(e) => update({ italic: e.target.checked })} className="accent-[#3a47ff]" />
            <span className="italic">Italic</span>
          </label>
        </div>
        <div className="grid grid-cols-[1fr_5rem] items-end gap-2">
          <Slider label="Size" value={el.size} min={4} max={120} step={0.5} unit="pt" onChange={(v) => update({ size: v }, 'size')} />
          <input type="number" value={el.size} min={2} max={400} step={0.5} onChange={(e) => update({ size: Math.max(2, Math.min(400, +e.target.value || 2)) }, 'size')} className="input input-sm" aria-label="Font size in points" />
        </div>
        <ColorSwatches value={el.color} onChange={(c) => update({ color: c })} colors={[doc.theme.colors.text, doc.theme.colors.muted, doc.theme.colors.accent, '#FFFFFF', '#25231F', ...doc.theme.palette]} />
      </Section>
      <Section title="Alignment">
        <Seg
          value={el.align}
          onChange={(v) => update({ align: v })}
          options={[
            { id: 'left', label: <AlignLeft size={15} />, title: 'Align left' },
            { id: 'center', label: <AlignCenter size={15} />, title: 'Align centre' },
            { id: 'right', label: <AlignRight size={15} />, title: 'Align right' },
          ]}
        />
        <Seg
          value={el.valign}
          onChange={(v) => update({ valign: v })}
          options={[
            { id: 'top', label: <AlignVerticalJustifyStart size={15} />, title: 'Top' },
            { id: 'middle', label: <AlignVerticalJustifyCenter size={15} />, title: 'Middle' },
            { id: 'bottom', label: <AlignVerticalJustifyEnd size={15} />, title: 'Bottom' },
          ]}
        />
      </Section>
      <Section title="Spacing">
        <Slider label="Line height" value={el.lineHeight} min={0.8} max={2.5} step={0.05} onChange={(v) => update({ lineHeight: v }, 'lh')} />
        <Slider label="Letter spacing" value={el.letterSpacing} min={-0.05} max={0.5} step={0.01} unit="em" onChange={(v) => update({ letterSpacing: v }, 'ls')} />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={el.uppercase} onChange={(e) => update({ uppercase: e.target.checked })} className="accent-[#3a47ff]" /> Uppercase
        </label>
      </Section>
    </>
  );
}

function ShapeProps({ el }: { el: ShapeElement }) {
  const doc = useEditor((s) => s.doc);
  const update = useUpdate(el);
  const colors = [doc.theme.colors.accent, doc.theme.colors.text, doc.theme.colors.muted, '#FFFFFF', ...doc.theme.palette];
  return (
    <>
      {el.shape !== 'line' && (
        <Section title="Fill">
          <ColorSwatches value={el.fill} onChange={(c) => update({ fill: c })} colors={colors} />
          {el.fill && <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => update({ fill: null })}>No fill</button>}
        </Section>
      )}
      <Section title={el.shape === 'line' ? 'Line' : 'Outline'}>
        <ColorSwatches value={el.stroke} onChange={(c) => update({ stroke: c })} colors={colors} />
        {el.stroke && el.shape !== 'line' && <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => update({ stroke: null })}>No outline</button>}
        <Slider label="Width" value={el.strokeWidth} min={0.25} max={12} step={0.25} unit="pt" onChange={(v) => update({ strokeWidth: v }, 'sw')} />
      </Section>
      {el.shape === 'rect' && <Slider label="Corner radius" value={el.radius} min={0} max={80} step={1} unit="pt" onChange={(v) => update({ radius: v }, 'radius')} />}
      <Slider label="Opacity" value={el.opacity} min={0.05} max={1} step={0.05} onChange={(v) => update({ opacity: v }, 'opacity')} />
    </>
  );
}

function OrnamentProps({ el }: { el: OrnamentElement }) {
  const doc = useEditor((s) => s.doc);
  const update = useUpdate(el);
  return (
    <Section title="Colour">
      <ColorSwatches value={el.color} onChange={(c) => update({ color: c })} colors={[doc.theme.colors.accent, doc.theme.colors.text, doc.theme.colors.muted, '#FFFFFF', ...doc.theme.palette]} />
      <Slider label="Opacity" value={el.opacity} min={0.05} max={1} step={0.05} onChange={(v) => update({ opacity: v }, 'opacity')} />
    </Section>
  );
}

function Arrange({ el }: { el: AlbumElement }) {
  const doc = useEditor((s) => s.doc);
  const update = useUpdate(el);
  const s = useEditor.getState();
  const mmW = doc.size.widthMm;
  const mmH = doc.size.heightMm;
  const num = (label: string, value: number, onChange: (v: number) => void) => (
    <label className="block">
      <span className="text-[11px] text-muted">{label}</span>
      <input type="number" step={0.5} value={Math.round(value * 10) / 10} onChange={(e) => onChange(+e.target.value)} className="input input-sm mt-0.5 tabular-nums" />
    </label>
  );
  const mutate = (fn: (pg: NonNullable<ReturnType<typeof pageAt>>) => void) =>
    s.apply((d) => {
      const pg = pageAt(d, s.active);
      if (pg) fn(pg);
    });
  return (
    <>
      <Section title="Position & size (mm)">
        <div className="grid grid-cols-2 gap-2">
          {num('X', el.x * mmW, (v) => update({ x: v / mmW }, 'pos'))}
          {num('Y', el.y * mmH, (v) => update({ y: v / mmH }, 'pos'))}
          {num('Width', el.w * mmW, (v) => update({ w: Math.max(1, v) / mmW }, 'size'))}
          {num('Height', el.h * mmH, (v) => update({ h: Math.max(0.5, v) / mmH }, 'size'))}
        </div>
        <Slider label="Rotation" value={el.rotation} min={-180} max={180} step={0.5} unit="°" onChange={(v) => update({ rotation: v }, 'rot')} />
      </Section>
      <Section title="Arrange">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => mutate((pg) => reorderElement(pg, el.id, 'forward'))}>
            <BringToFront size={14} /> Forward
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => mutate((pg) => reorderElement(pg, el.id, 'backward'))}>
            <SendToBack size={14} /> Backward
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { let id = ''; mutate((pg) => { id = duplicateElement(pg, el.id)?.id ?? ''; }); if (id) s.select(id); }}>
            <Copy size={14} /> Duplicate
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => update({ locked: !el.locked })}>
            {el.locked ? <LockOpen size={14} /> : <Lock size={14} />} {el.locked ? 'Unlock' : 'Lock'}
          </button>
        </div>
        <button type="button" className="btn btn-sm w-full border border-danger/30 text-danger hover:bg-danger-soft" onClick={() => { mutate((pg) => removeElement(pg, el.id)); s.select(null); }}>
          <Trash2 size={14} /> Delete {TYPE_LABEL[el.type].toLowerCase()}
        </button>
      </Section>
    </>
  );
}

function PageProps() {
  const doc = useEditor((s) => s.doc);
  const active = useEditor((s) => s.active);
  const page = pageAt(doc, active);
  const s = useEditor.getState();
  if (!page) return null;
  const photos = page.elements.filter((e) => e.type === 'photo');
  return (
    <>
      <p className="text-sm text-ink-soft">Select anything on the page to edit it. Click empty space to come back here.</p>
      <Section title="Page">
        <div className="rounded-xl bg-paper p-4 text-sm">
          <p>{photos.length} photo {photos.length === 1 ? 'frame' : 'frames'} · {photos.filter((p) => p.type === 'photo' && p.photoId).length} filled</p>
          <p className="text-muted">{page.elements.filter((e) => e.type === 'text').length} text boxes</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => s.setPanel('layouts')}>Change layout</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => s.setPanel('backgrounds')}>Background</button>
        </div>
      </Section>
      <Section title="Background colour">
        <ColorSwatches value={page.background.color} onChange={(c) => s.apply((d) => { const pg = pageAt(d, s.active); if (pg) pg.background.color = c; })} colors={doc.theme.palette} />
      </Section>
      {active.kind === 'page' && (
        <Section title="Page actions">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { let n = 0; s.apply((d) => { n = duplicatePage(d, active.index); }); s.setActive({ kind: 'page', index: n }); }}>
              <Copy size={14} /> Duplicate
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={doc.pages.length <= 1} onClick={() => { s.apply((d) => void deletePage(d, active.index)); s.setActive({ kind: 'page', index: Math.max(0, active.index - 1) }); s.toast('Page deleted — press Undo to restore it'); }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </Section>
      )}
    </>
  );
}
