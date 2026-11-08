'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * One-click start: creates the album as soon as this screen opens and moves
 * straight on to adding photos. Name, size and everything else can be changed
 * later in the editor.
 */
export function StartAlbum({ request, visual, title }: { request: Record<string, unknown>; visual: ReactNode; title: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const start = async () => {
    setError(null);
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'We couldn’t start your album.');
      router.replace(`/projects/${data.id}/photos`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We couldn’t start your album.');
      started.current = false;
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grain relative isolate grid min-h-[calc(100svh-4rem)] place-items-center overflow-hidden bg-night px-6 py-16 text-center text-white md:min-h-[calc(100svh-4.5rem)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora absolute -left-[10%] -top-[30%] h-[70%] w-[60%] rounded-full bg-accent/30 blur-[140px]" />
        <div className="aurora absolute -bottom-[30%] -right-[10%] h-[60%] w-[50%] rounded-full bg-rose/15 blur-[140px]" style={{ animationDelay: '-7s' }} />
      </div>
      <div className="w-full max-w-md">
        <div className="mx-auto w-[min(18rem,70vw)]">
          <div className="drop-in float-slow" style={{ ['--r' as string]: '-3deg', ['--r-from' as string]: '-14deg' }}>
            {visual}
          </div>
        </div>
        {error ? (
          <>
            <h1 className="mt-12 font-serif text-4xl">Something got in the way.</h1>
            <p className="mt-3 text-white/70">{error}</p>
            <div className="mt-8 flex justify-center gap-3">
              <button type="button" onClick={() => void start()} className="btn btn-light">
                <RotateCcw size={15} /> Try again
              </button>
              <Link href="/templates" className="btn btn-outline-light">Back to templates</Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="rise mt-12 font-serif text-4xl font-medium md:text-5xl" style={{ animationDelay: '0.2s' }}>
              Preparing <span className="italic text-gradient">{title}</span>
            </h1>
            <p className="rise mt-3 text-white/60" style={{ animationDelay: '0.35s' }}>Setting out every page for your photos…</p>
            <div className="rise mx-auto mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/10" style={{ animationDelay: '0.45s' }}>
              <div className="h-full w-1/3 animate-[fs-progress_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-accent via-violet to-rose" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
