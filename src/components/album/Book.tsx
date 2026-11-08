import type { CSSProperties } from 'react';
import type { Page, PageSize, PhotoMap } from '@/lib/album/types';
import { PageView } from './PageView';

/** Cloth colours for the hard cover board that frames an open spread. */
export const BOARDS = {
  red: 'linear-gradient(90deg,#4a0711,#7a1020 3%,#7a1020 97%,#4a0711)',
  ink: 'linear-gradient(90deg,#070405,#1b1214 3%,#1b1214 97%,#070405)',
} as const;
export type BookBoard = keyof typeof BOARDS;

/** Keep `relative` unless the caller positions the element itself. */
const positioned = (cls: string) => (/\b(absolute|fixed|sticky)\b/.test(cls) ? '' : 'relative');

interface BaseProps {
  size: Pick<PageSize, 'widthMm' | 'heightMm'>;
  photos: PhotoMap;
  renderWidth?: number;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
}

/** A closed hardcover book showing the front cover. */
export function BookCover({ page, size, photos, renderWidth = 400, className = '', style, eager }: BaseProps & { page: Page }) {
  return (
    <div className={`${positioned(className)} ${className}`} style={style}>
      {/* page block peeking out at the fore-edge and bottom */}
      <div
        aria-hidden
        className="absolute rounded-[2px]"
        style={{
          top: '1.2%',
          left: '1.5%',
          right: '-1.4%',
          bottom: '-1.4%',
          background: 'repeating-linear-gradient(90deg,#f9f7f7 0 1px,#e7e1e1 1px 2px)',
          boxShadow: '0 22px 46px -16px rgb(19 8 10 / .5), 0 4px 10px -4px rgb(19 8 10 / .25)',
        }}
      />
      <div className="relative overflow-hidden rounded-[1px_3px_3px_1px]" style={{ boxShadow: '0 1px 1px rgb(0 0 0 / .08)' }}>
        <PageView page={page} size={size} photos={photos} renderWidth={renderWidth} eager={eager} emptyFrames="placeholder" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/30 via-black/8 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[4.2%] w-px bg-white/25" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/14 via-transparent to-black/12" />
      </div>
    </div>
  );
}

/** An open book showing a two-page spread. Null slots render as endpapers. */
export function OpenBook({
  left,
  right,
  size,
  photos,
  renderWidth = 900,
  className = '',
  style,
  endpaper = '#7A1020',
  board = 'red',
  eager,
}: BaseProps & { left: Page | null; right: Page | null; endpaper?: string; board?: BookBoard }) {
  const half = renderWidth / 2;
  return (
    <div className={`${positioned(className)} ${className}`} style={style}>
      <div
        aria-hidden
        className="absolute rounded-[3px]"
        style={{
          inset: '0.8% -0.9% -1.6% -0.9%',
          background: BOARDS[board],
          boxShadow: '0 36px 70px -26px rgb(19 8 10 / .55), 0 8px 18px -8px rgb(19 8 10 / .3)',
        }}
      />
      <div className="relative flex overflow-hidden rounded-[2px]">
        <BookSide page={left} side="left" size={size} photos={photos} width={half} eager={eager} endpaper={endpaper} />
        <BookSide page={right} side="right" size={size} photos={photos} width={half} eager={eager} endpaper={endpaper} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-[6%] -translate-x-1/2 spread-gutter" />
      </div>
    </div>
  );
}

export function BookSide({
  page,
  side,
  size,
  photos,
  width,
  eager,
  endpaper,
}: {
  page: Page | null;
  side: 'left' | 'right';
  size: Pick<PageSize, 'widthMm' | 'heightMm'>;
  photos: PhotoMap;
  width: number;
  eager?: boolean;
  endpaper: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      {page ? (
        <PageView page={page} size={size} photos={photos} renderWidth={width} eager={eager} />
      ) : (
        <div style={{ aspectRatio: `${size.widthMm} / ${size.heightMm}`, background: endpaper }} />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            side === 'left'
              ? 'linear-gradient(90deg, rgb(0 0 0 / .05) 0%, transparent 12%, transparent 80%, rgb(0 0 0 / .10) 94%, rgb(0 0 0 / .22) 100%)'
              : 'linear-gradient(270deg, rgb(0 0 0 / .05) 0%, transparent 12%, transparent 80%, rgb(0 0 0 / .08) 94%, rgb(0 0 0 / .2) 100%)',
        }}
      />
    </div>
  );
}

/** A single flat page with a soft paper shadow (for thumbnails). */
export function FlatPage({ page, size, photos, renderWidth = 300, className = '', style, eager }: BaseProps & { page: Page }) {
  return (
    <div className={`overflow-hidden rounded-[2px] bg-white shadow-[0_1px_2px_rgb(10_10_15/.08),0_6px_16px_-8px_rgb(10_10_15/.28)] ${className}`} style={style}>
      <PageView page={page} size={size} photos={photos} renderWidth={renderWidth} eager={eager} />
    </div>
  );
}
