'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, Eye, Pause, Play, X } from 'lucide-react';
import { ANIMATIONS, normaliseMusicUrl, presentationOf } from '@/lib/album/presentation';
import type { AlbumDocument, PageAnimation, Presentation } from '@/lib/album/types';
import { useEditor } from './store';

function update(patch: Partial<Presentation>) {
  useEditor.getState().apply(
    (d) => {
      (d as AlbumDocument).presentation = { ...presentationOf(d as AlbumDocument), ...patch };
    },
    { key: 'presentation' },
  );
}

/** A tiny looping demonstration of a page animation. */
function AnimationDemo({ id, tick }: { id: PageAnimation; tick: number }) {
  const cls = id === 'flip' ? 'viewer-turn' : `pa pa-${id}`;
  return (
    <div className="relative h-14 overflow-hidden rounded-[2px] bg-[#140d0e]" style={{ perspective: '400px' }}>
      <div className="absolute inset-0 grid place-items-center">
        <div key={tick} className={cls} data-dir="1" style={{ width: '70%' }}>
          <div className="flex h-9 overflow-hidden rounded-[1px] bg-[#f6f2ee] shadow-[0_6px_14px_-6px_rgb(0_0_0/.8)]">
            <div className="flex-1 p-1">
              <div className="h-full w-full bg-[#b9a89a]" />
            </div>
            <div className="w-px bg-black/10" />
            <div className="flex flex-1 flex-col justify-center gap-0.5 p-1.5">
              <div className="h-[2px] w-3/4 bg-black/30" />
              <div className="h-[2px] w-1/2 bg-black/20" />
              <div className="h-[2px] w-2/3 bg-black/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type MusicStatus = 'idle' | 'checking' | 'playing' | 'ok' | 'error';

export function MotionPanel() {
  const doc = useEditor((s) => s.doc);
  const projectId = useEditor((s) => s.projectId);
  const show = presentationOf(doc);
  const [tick, setTick] = useState(0);
  const [draft, setDraft] = useState(show.musicUrl ?? '');
  const [status, setStatus] = useState<MusicStatus>(show.musicUrl ? 'ok' : 'idle');
  const audio = useRef<HTMLAudioElement | null>(null);

  // Replay the little demos so each style is always visibly moving.
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 2400);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => () => audio.current?.pause(), []);

  const stop = () => {
    audio.current?.pause();
    if (status === 'playing') setStatus('ok');
  };

  /** Saves the link and plays it, so the person hears straight away whether it works. */
  const applyMusic = (play: boolean) => {
    const url = normaliseMusicUrl(draft);
    if (!draft.trim()) {
      update({ musicUrl: null });
      setStatus('idle');
      return;
    }
    if (!url) {
      setStatus('error');
      return;
    }
    if (url !== draft) setDraft(url);
    update({ musicUrl: url });
    audio.current?.pause();
    const a = new Audio(url);
    audio.current = a;
    a.volume = 0.7;
    setStatus('checking');
    a.addEventListener('error', () => setStatus('error'), { once: true });
    if (play) {
      a.play()
        .then(() => setStatus('playing'))
        .catch(() => setStatus('error'));
    } else {
      a.addEventListener('canplay', () => setStatus('ok'), { once: true });
      a.load();
    }
  };

  const remove = () => {
    audio.current?.pause();
    setDraft('');
    setStatus('idle');
    update({ musicUrl: null });
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="smallcaps">Page animation</p>
        <p className="mt-1 text-xs text-muted">How pages change in the online album and the share link.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ANIMATIONS.map((a) => {
            const active = show.animation === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => update({ animation: a.id })}
                aria-pressed={active}
                className={`rounded-[3px] border p-1.5 text-left transition ${active ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong'}`}
              >
                <AnimationDemo id={a.id} tick={tick} />
                <span className="mt-1.5 flex items-center justify-between px-0.5 text-[0.8125rem] font-medium">
                  {a.label}
                  {active && <Check size={13} className="text-accent" />}
                </span>
                <span className="block px-0.5 pb-0.5 text-[0.6875rem] leading-snug text-muted">{a.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span className="smallcaps block">Living photos</span>
            <span className="mt-1 block text-xs text-muted">Photos drift slowly while the album is open, like a film.</span>
          </span>
          <span className="relative mt-0.5 inline-flex shrink-0">
            <input type="checkbox" className="peer sr-only" checked={show.livingPhotos} onChange={(e) => update({ livingPhotos: e.target.checked })} />
            <span className="h-5 w-9 rounded-full bg-line-strong transition peer-checked:bg-accent" />
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
          </span>
        </label>
      </section>

      <section>
        <p className="smallcaps">Music</p>
        <p className="mt-1 text-xs text-muted">Paste a link to an MP3. It starts playing when someone opens your album. Google Drive and Dropbox links work too.</p>
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            inputMode="url"
            placeholder="https://…/our-song.mp3"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            onBlur={() => {
              if ((normaliseMusicUrl(draft) ?? '') !== (show.musicUrl ?? '')) applyMusic(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyMusic(true);
            }}
            className="input input-sm min-w-0 flex-1"
            aria-label="Music link"
          />
          {status === 'playing' ? (
            <button type="button" onClick={stop} className="btn btn-secondary btn-sm !px-2.5" aria-label="Stop">
              <Pause size={14} />
            </button>
          ) : (
            <button type="button" onClick={() => applyMusic(true)} disabled={!draft.trim()} className="btn btn-primary btn-sm !px-2.5" aria-label="Play and use this music">
              <Play size={14} />
            </button>
          )}
        </div>
        <p className="mt-2 min-h-[1rem] text-xs" aria-live="polite">
          {status === 'checking' && <span className="text-muted">Checking the link…</span>}
          {status === 'playing' && <span className="text-success">Playing — this is the music your album opens with.</span>}
          {status === 'ok' && show.musicUrl && <span className="text-success">Music added. It plays when the album opens.</span>}
          {status === 'error' && <span className="text-danger">This link can’t be played. Use a direct link to an MP3 file.</span>}
        </p>
        {show.musicUrl && (
          <button type="button" onClick={remove} className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-danger">
            <X size={12} /> Remove music
          </button>
        )}
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-faint">Only use music you have the right to share.</p>
      </section>

      <Link href={`/projects/${projectId}/preview`} className="btn btn-secondary w-full text-[0.75rem] uppercase tracking-[0.16em]">
        <Eye size={14} /> Watch the album
      </Link>
    </div>
  );
}
