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
    <div role="dialog" aria-label="Editor tips" className="fixed bottom-28 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-night p-6 text-white shadow-[0_30px_80px_-20px_rgb(142_17_38/.55)] animate-fade-up xl:right-[19rem]">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/40 blur-3xl" />
      <button type="button" onClick={close} aria-label="Close tips" className="absolute right-4 top-4 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white">
        <X size={16} />
      </button>
      <p className="relative font-serif text-2xl">Your album is ready to edit ✦</p>
      <ul className="relative mt-4 space-y-3 text-sm text-white/80">
        {[
          { icon: ImagePlus, t: 'Add photos from the Photos panel, or drop files anywhere.' },
          { icon: MousePointerClick, t: 'Drag a photo onto any frame. Double-click a photo to crop it.' },
          { icon: Type, t: 'Double-click text to write your own words.' },
          { icon: LayoutTemplate, t: 'Try a different layout — your photos come with you.' },
        ].map(({ icon: Icon, t }) => (
          <li key={t} className="flex gap-3">
            <Icon size={17} className="mt-0.5 shrink-0 text-[#f4a7b3]" /> {t}
          </li>
        ))}
      </ul>
      <button type="button" onClick={close} className="btn btn-light btn-sm relative mt-6 w-full">
        Start creating
      </button>
    </div>
  );
}
