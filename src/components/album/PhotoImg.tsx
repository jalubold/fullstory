'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * An album photo that never shows the browser's broken-image icon. Photo URLs
 * redirect to short-lived signed links, so a stale or interrupted load is
 * retried once with a fresh request; if that fails too the frame stays empty.
 */
export function PhotoImg({ src, alt, eager, style }: { src: string; alt: string; eager?: boolean; style: CSSProperties }) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState({ src, attempt: 0, failed: false });
  if (state.src !== src) setState({ src, attempt: 0, failed: false });

  const retryable = !src.startsWith('blob:') && !src.startsWith('data:');
  const url = state.attempt ? `${src}${src.includes('?') ? '&' : '?'}retry=${state.attempt}` : src;

  const onError = () => setState((s) => (s.src !== src ? s : retryable && s.attempt < 1 ? { ...s, attempt: s.attempt + 1 } : { ...s, failed: true }));

  useEffect(() => {
    // An error that happened before hydration is not replayed; catch it here.
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0 && img.getAttribute('src')) onError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={url}
      alt={alt}
      draggable={false}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={onError}
      style={{ ...style, visibility: state.failed ? 'hidden' : undefined }}
    />
  );
}
