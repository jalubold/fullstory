import { PageView } from '@/components/album/PageView';
import type { Page, PageSize, PhotoMap } from '@/lib/album/types';

/**
 * A looping, CSS-only demonstration of the editor: a photo is picked up from
 * the library, dropped into an empty frame, and the caption appears.
 */
export function EditorDemo({ page, size, photos, thumbs }: { page: Page; size: PageSize; photos: PhotoMap; thumbs: string[] }) {
  const empty: Page = { ...page, elements: page.elements.map((e) => (e.type === 'photo' ? { ...e, photoId: null } : e)) };
  const target = page.elements.find((e) => e.type === 'photo');
  return (
    <div className="relative overflow-hidden rounded-[4px] border border-line-strong bg-card p-3 shadow-[0_40px_80px_-40px_rgb(19_12_13/.35)] sm:p-4">
      <div className="mb-3 flex items-center gap-3 border-b border-line px-1 pb-3">
        <span className="smallcaps !text-ink">The Studio</span>
        <span className="text-[11px] text-muted">Slow Days · page 4</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Saved
        </span>
      </div>
      <div className="grid grid-cols-[5.5rem_1fr] gap-3 sm:grid-cols-[7rem_1fr]">
        <div className="space-y-2 bg-paper-2 p-2">
          {thumbs.slice(0, 4).map((src, i) => (
            <div key={i} className={`relative aspect-square overflow-hidden rounded-[2px] bg-paper-3 ${i === 0 ? 'demo-thumb' : ''}`}>
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
        <div className="relative grid place-items-center bg-editor p-4 sm:p-6">
          <div className="relative w-full max-w-[22rem] shadow-[0_20px_40px_-20px_rgb(19_12_13/.45)]">
            <PageView page={empty} size={size} photos={photos} renderWidth={360} emptyFrames="drop-target" />
            <div className="demo-fill absolute inset-0">
              <PageView page={page} size={size} photos={photos} renderWidth={360} />
            </div>
            {target && (
              <div
                aria-hidden
                className="demo-select pointer-events-none absolute outline outline-2 outline-accent"
                style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%`, width: `${target.w * 100}%`, height: `${target.h * 100}%` }}
              />
            )}
          </div>
          <div aria-hidden className="demo-ghost pointer-events-none absolute left-[-3.5rem] top-[1.2rem] h-14 w-14 overflow-hidden rounded-[2px] shadow-2xl ring-2 ring-white sm:left-[-4.5rem]">
            <img src={thumbs[0]} alt="" className="h-full w-full object-cover" />
          </div>
          <svg aria-hidden className="demo-cursor pointer-events-none absolute left-[-1.5rem] top-[2.6rem] h-5 w-5 drop-shadow" viewBox="0 0 24 24">
            <path d="M4 3l7 17 2.5-7.5L21 10z" fill="#fff" stroke="#0a0a0f" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
