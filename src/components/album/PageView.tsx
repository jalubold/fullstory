import type { CSSProperties, ReactNode } from 'react';
import { cssFontStack } from '@/lib/album/fonts';
import { backgroundPrimitives, computeCrop, pageSizePt } from '@/lib/album/geometry';
import { ORNAMENTS } from '@/lib/album/ornaments';
import { photoUrl } from '@/lib/album/photos';
import { PhotoImg } from './PhotoImg';
import type {
  AlbumElement,
  Background,
  OrnamentElement,
  Page,
  PageSize,
  PhotoElement,
  PhotoMap,
  ShapeElement,
  TextElement,
} from '@/lib/album/types';

export interface PageViewProps {
  page: Page;
  size: Pick<PageSize, 'widthMm' | 'heightMm'>;
  photos: PhotoMap;
  /** Approximate on-screen width in CSS px, used to pick image resolution. */
  renderWidth?: number;
  /** How empty photo frames look. */
  emptyFrames?: 'placeholder' | 'drop-target' | 'hidden';
  /** Elements to skip (e.g. text currently being edited in place). */
  hiddenIds?: ReadonlySet<string>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  eager?: boolean;
}

const pct = (n: number) => `${n * 100}%`;

/**
 * Renders one album page from the document model. Pure and hook-free, so it
 * works in Server Components (template previews) and Client Components (editor).
 * Physical units scale with the page via container query units.
 */
export function PageView({
  page,
  size,
  photos,
  renderWidth = 600,
  emptyFrames = 'placeholder',
  hiddenIds,
  className,
  style,
  children,
  eager,
}: PageViewProps) {
  const { w: Wpt, h: Hpt } = pageSizePt(size);
  const ctx: RenderCtx = { Wpt, Hpt, photos, renderWidth, emptyFrames, eager: !!eager };
  return (
    <div
      className={`fs-page ${className ?? ''}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${size.widthMm} / ${size.heightMm}`,
        containerType: 'inline-size',
        overflow: 'hidden',
        background: page.background.color,
        ...style,
      }}
    >
      <BackgroundLayer bg={page.background} Wpt={Wpt} Hpt={Hpt} pageId={page.id} />
      {page.elements.map((el) =>
        hiddenIds?.has(el.id) ? null : <ElementView key={el.id} el={el} ctx={ctx} />,
      )}
      {children}
    </div>
  );
}

interface RenderCtx {
  Wpt: number;
  Hpt: number;
  photos: PhotoMap;
  renderWidth: number;
  emptyFrames: 'placeholder' | 'drop-target' | 'hidden';
  eager: boolean;
}

const cq = (pt: number, Wpt: number) => `${(pt / Wpt) * 100}cqw`;

export function elementBoxStyle(el: Pick<AlbumElement, 'x' | 'y' | 'w' | 'h' | 'rotation'>): CSSProperties {
  return {
    position: 'absolute',
    left: pct(el.x),
    top: pct(el.y),
    width: pct(el.w),
    height: pct(el.h),
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
  };
}

function ElementView({ el, ctx }: { el: AlbumElement; ctx: RenderCtx }) {
  switch (el.type) {
    case 'photo':
      return <PhotoView el={el} ctx={ctx} />;
    case 'text':
      return <TextView el={el} ctx={ctx} />;
    case 'shape':
      return <ShapeView el={el} ctx={ctx} />;
    case 'ornament':
      return <OrnamentView el={el} />;
  }
}

function BackgroundLayer({ bg, Wpt, Hpt, pageId }: { bg: Background; Wpt: number; Hpt: number; pageId: string }) {
  if (bg.pattern === 'none') return null;
  const svgStyle: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' };
  if (bg.pattern === 'dots') {
    // Dots repeat thousands of times per page, so they are drawn with a single
    // SVG pattern tile. Geometry matches backgroundPrimitives() used by the PDF renderer.
    const unit = Math.min(Wpt, Hpt) / 576;
    const step = 14 * unit;
    const id = `fsdots-${pageId}-${Math.round(Wpt)}x${Math.round(Hpt)}`.replace(/[^\w-]/g, '');
    return (
      <svg aria-hidden viewBox={`0 0 ${Wpt} ${Hpt}`} preserveAspectRatio="none" style={svgStyle}>
        <defs>
          <pattern id={id} width={step} height={step} patternUnits="userSpaceOnUse">
            <circle cx={step / 2} cy={step / 2} r={0.9 * unit} fill={bg.patternColor} />
          </pattern>
        </defs>
        <rect width={Wpt} height={Hpt} fill={`url(#${id})`} opacity={0.45} />
      </svg>
    );
  }
  const { prims, opacity } = backgroundPrimitives(bg, Wpt, Hpt);
  return (
    <svg aria-hidden viewBox={`0 0 ${Wpt} ${Hpt}`} preserveAspectRatio="none" style={svgStyle}>
      <g opacity={opacity} fill={bg.patternColor} stroke={bg.patternColor}>
        {prims.map((p, i) =>
          p.kind === 'line' ? (
            <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} strokeWidth={p.width} />
          ) : p.kind === 'circle' ? (
            <circle key={i} cx={p.cx} cy={p.cy} r={p.r} stroke="none" />
          ) : (
            <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} strokeWidth={p.width} fill="none" />
          ),
        )}
      </g>
    </svg>
  );
}

export function PhotoView({ el, ctx }: { el: PhotoElement; ctx: RenderCtx }) {
  const { Wpt, Hpt } = ctx;
  const frameW = el.w * Wpt;
  const frameH = el.h * Hpt;
  const bw = Math.max(0, Math.min(el.borderWidth, frameW / 2 - 1, frameH / 2 - 1));
  const innerW = frameW - bw * 2;
  const innerH = frameH - bw * 2;
  const ellipse = el.shape === 'ellipse';
  const asset = el.photoId ? ctx.photos[el.photoId] : undefined;
  const outerRadius = ellipse ? '50%' : cq(el.radius, Wpt);
  const innerRadius = ellipse ? '50%' : cq(Math.max(0, el.radius - bw), Wpt);

  let content: ReactNode = null;
  if (asset) {
    const c = computeCrop(asset.width, asset.height, innerW, innerH, el.crop);
    const needed = (innerW / Wpt) * c.relW * ctx.renderWidth * 2;
    content = (
      <PhotoImg
        src={photoUrl(asset, needed)}
        alt={asset.alt ?? ''}
        eager={ctx.eager}
        style={{
          position: 'absolute',
          left: pct(c.relX),
          top: pct(c.relY),
          width: pct(c.relW),
          height: pct(c.relH),
          maxWidth: 'none',
          userSelect: 'none',
          color: 'transparent',
          filter: el.filter === 'bw' ? 'grayscale(1)' : el.filter === 'sepia' ? 'sepia(1)' : undefined,
        }}
      />
    );
  } else if (el.photoId && !asset) {
    content = <EmptyFrame mode="placeholder" missing />;
  } else if (ctx.emptyFrames !== 'hidden') {
    content = <EmptyFrame mode={ctx.emptyFrames} />;
  }

  return (
    <div
      data-el={el.id}
      style={{
        ...elementBoxStyle(el),
        borderRadius: outerRadius,
        background: bw > 0 ? el.borderColor : undefined,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: cq(bw, Wpt),
          borderRadius: innerRadius,
          overflow: 'hidden',
          background: asset?.placeholder ?? 'transparent',
        }}
      >
        {content}
      </div>
    </div>
  );
}

function EmptyFrame({ mode, missing }: { mode: 'placeholder' | 'drop-target'; missing?: boolean }) {
  return (
    <div
      className={mode === 'drop-target' ? 'fs-empty-frame fs-empty-frame--drop' : 'fs-empty-frame'}
      style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}
    >
      <svg viewBox="0 0 24 24" style={{ width: '22%', maxWidth: 48, minWidth: 10, opacity: 0.45 }} aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="9" cy="10" r="1.6" fill="currentColor" />
        <path d="M4 17l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        {missing ? <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.4" /> : null}
      </svg>
    </div>
  );
}

export function textStyle(el: TextElement, Wpt: number): CSSProperties {
  return {
    fontFamily: cssFontStack(el.font),
    fontWeight: el.weight,
    fontStyle: el.italic ? 'italic' : 'normal',
    fontSize: cq(el.size, Wpt),
    lineHeight: el.lineHeight,
    letterSpacing: `${el.letterSpacing}em`,
    color: el.color,
    textAlign: el.align,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    fontKerning: 'none',
    fontVariantLigatures: 'none',
    fontFeatureSettings: '"kern" 0, "liga" 0, "calt" 0',
    fontSynthesis: 'none',
  };
}

export function displayText(el: TextElement): string {
  return el.uppercase ? el.text.toUpperCase() : el.text;
}

function TextView({ el, ctx }: { el: TextElement; ctx: RenderCtx }) {
  return (
    <div
      data-el={el.id}
      style={{
        ...elementBoxStyle(el),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: el.valign === 'top' ? 'flex-start' : el.valign === 'bottom' ? 'flex-end' : 'center',
      }}
    >
      <div style={textStyle(el, ctx.Wpt)}>{displayText(el) || '​'}</div>
    </div>
  );
}

function ShapeView({ el, ctx }: { el: ShapeElement; ctx: RenderCtx }) {
  const w = el.w * ctx.Wpt;
  const h = el.h * ctx.Hpt;
  const common = {
    fill: el.fill ?? 'none',
    stroke: el.stroke ?? 'none',
    strokeWidth: el.stroke ? el.strokeWidth : 0,
  };
  return (
    <div data-el={el.id} style={{ ...elementBoxStyle(el), opacity: el.opacity }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
        {el.shape === 'rect' ? (
          <rect x={0} y={0} width={w} height={h} rx={el.radius} {...common} />
        ) : el.shape === 'ellipse' ? (
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...common} />
        ) : (
          <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke={el.stroke ?? el.fill ?? '#000'} strokeWidth={el.strokeWidth} />
        )}
      </svg>
    </div>
  );
}

function OrnamentView({ el }: { el: OrnamentElement }) {
  const def = ORNAMENTS[el.ornament];
  if (!def) return null;
  return (
    <div data-el={el.id} style={{ ...elementBoxStyle(el), opacity: el.opacity }}>
      <svg viewBox={`0 0 ${def.viewBox[0]} ${def.viewBox[1]}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        {def.paths.map((p, i) =>
          p.mode === 'fill' ? (
            <path key={i} d={p.d} fill={el.color} opacity={p.opacity} />
          ) : (
            <path key={i} d={p.d} fill="none" stroke={el.color} strokeWidth={p.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" opacity={p.opacity} />
          ),
        )}
      </svg>
    </div>
  );
}
