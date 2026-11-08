'use client';

import { useEffect, useState } from 'react';
import { ImagePlus, LayoutTemplate, MousePointerClick, Type, X } from 'lucide-react';

const KEY = 'fs:tips:v1';

/** A one-time welcome card with the three things people need to know. */
export function WelcomeTips() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {}
  }, []);
  if (!open) return null;
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {}
  };
  return (
    <div role="dialog" aria-label="Editor tips" className="fixed bottom-28 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[4px] border border-line-strong bg-card p-6 pt-7 text-ink shadow-[0_30px_60px_-24px_rgb(19_12_13/.4)] animate-fade-up xl:right-[19rem]">
      <span aria-hidden className="ribbon absolute right-10 top-0 h-14 w-4" />
      <button type="button" onClick={close} aria-label="Close tips" className="absolute left-auto right-16 top-3 rounded-[2px] p-1 text-muted hover:bg-paper-2 hover:text-ink">
        <X size={16} />
      </button>
      <p className="smallcaps">Before you begin</p>
      <p className="relative mt-2 font-serif text-[1.7rem] leading-tight">Your album is ready to edit.</p>
      <ul className="relative mt-4 divide-y divide-line border-y border-line text-sm text-ink-soft">
        {[
          { icon: ImagePlus, t: 'Add photos from the Photos panel, or drop files anywhere.' },
          { icon: MousePointerClick, t: 'Drag a photo onto any frame. Double-click a photo to crop it.' },
          { icon: Type, t: 'Double-click text to write your own words.' },
          { icon: LayoutTemplate, t: 'Try a different layout — your photos come with you.' },
        ].map(({ icon: Icon, t }) => (
          <li key={t} className="flex gap-3 py-2.5">
            <Icon size={16} strokeWidth={1.6} className="mt-0.5 shrink-0 text-accent" /> {t}
          </li>
        ))}
      </ul>
      <button type="button" onClick={close} className="btn btn-primary btn-sm relative mt-5 w-full uppercase tracking-[0.18em] !text-[0.6875rem]">
        Start creating
      </button>
    </div>
  );
}
