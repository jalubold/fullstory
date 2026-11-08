'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

const TIMEOUT_MS = 20_000;
const NAV_FALLBACK_MS = 9_000;

class Retryable extends Error {}

/** POST /api/projects with a timeout. Network errors, timeouts and 5xx are retryable. */
async function createAlbum(request: Record<string, unknown>, clientKey: string, outer: AbortSignal): Promise<string> {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  outer.addEventListener('abort', onAbort);
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, clientKey }),
        signal: ctrl.signal,
      });
    } catch {
      throw new Retryable('The connection dropped while starting your album.');
    }
    const data = await res.json().catch(() => ({}));
    if (res.status >= 500) throw new Retryable(data.error ?? 'Our server had a hiccup.');
    if (!res.ok || !data.id) throw new Error(data.error ?? 'We couldn’t start your album.');
    return data.id as string;
  } finally {
    window.clearTimeout(timer);
    outer.removeEventListener('abort', onAbort);
  }
}

/**
 * One-click start: creates the album as soon as this screen is shown and moves
 * on to adding photos. Name, size and everything else can be changed later in
 * the editor.
 *
 * Next.js keeps visited pages alive (hidden with React <Activity>), so this
 * screen can be shown again later with its old state. Each showing therefore
 * starts a fresh album, while a request that was merely interrupted is resumed
 * with the same key — the server returns the same album instead of a duplicate.
 */
export function StartAlbum({ request, visual, title }: { request: Record<string, unknown>; visual: ReactNode; title: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const requestKey = JSON.stringify(request);
  const visit = useRef<{ key: string; requestKey: string; done: boolean } | null>(null);

  // When the page is hidden (navigated away), reset what the user would see on return.
  useLayoutEffect(
    () => () => {
      setError(null);
      setOpening(false);
    },
    [],
  );

  useEffect(() => {
    if (!visit.current || visit.current.done || visit.current.requestKey !== requestKey) {
      visit.current = { key: crypto.randomUUID(), requestKey, done: false };
    }
    const v = visit.current;
    const ctrl = new AbortController();
    let fallback: number | undefined;

    (async () => {
      for (let tryNo = 0; ; tryNo++) {
        try {
          const id = await createAlbum(JSON.parse(requestKey), v.key, ctrl.signal);
          if (ctrl.signal.aborted) return;
          v.done = true;
          setOpening(true);
          const url = `/projects/${id}/photos`;
          router.replace(url);
          // If the in-app navigation stalls, finish with a normal page load.
          fallback = window.setTimeout(() => {
            if (window.location.pathname.startsWith('/create/new')) window.location.replace(url);
          }, NAV_FALLBACK_MS);
          return;
        } catch (e) {
          if (ctrl.signal.aborted) return;
          if (e instanceof Retryable && tryNo < 2) {
            await new Promise((r) => window.setTimeout(r, 800 * (tryNo + 1)));
            if (ctrl.signal.aborted) return;
            continue;
          }
          setError(e instanceof Error ? e.message : 'We couldn’t start your album.');
          return;
        }
      }
    })();

    return () => {
      ctrl.abort();
      if (fallback) window.clearTimeout(fallback);
    };
  }, [requestKey, attempt, router]);

  return (
    <div className="cloth relative grid min-h-[calc(100svh-4rem)] place-items-center overflow-hidden px-6 py-16 text-center md:min-h-[calc(100svh-4.5rem)]">
      <div className="w-full max-w-md">
        <div className="mx-auto w-[min(17rem,66vw)]" style={{ perspective: '1600px' }}>
          <div className="book-in shadow-[0_40px_60px_-30px_rgb(0_0_0/.6)]">{visual}</div>
        </div>
        {error ? (
          <>
            <h1 className="mt-12 font-serif text-4xl">Something got in the way.</h1>
            <p className="mt-3 text-white/70">{error}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAttempt((n) => n + 1);
                }}
                className="btn btn-light text-[0.75rem] uppercase tracking-[0.2em]"
              >
                <RotateCcw size={14} /> Try again
              </button>
              <Link href="/templates" className="text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white">
                <span className="link-underline">Back to the collection</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="rise mt-12 font-serif text-4xl font-medium md:text-5xl" style={{ animationDelay: '0.2s' }}>
              {opening ? 'Opening' : 'Binding'} <span className="italic">{title}</span>
            </h1>
            <p className="rise mt-3 text-white/65" style={{ animationDelay: '0.35s' }}>
              {opening ? 'Your pages are ready — now for your photos…' : 'Setting out every page for your photos…'}
            </p>
            <div className="rise mx-auto mt-9 h-px w-56 overflow-hidden bg-white/20" style={{ animationDelay: '0.45s' }}>
              <div className="h-full w-1/3 animate-[fs-progress_1.2s_ease-in-out_infinite] bg-white" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
