'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, Eye, Loader2, Pause, Play, X } from 'lucide-react';
import { ANIMATIONS, presentationOf } from '@/lib/album/presentation';
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

type MusicStatus = 'idle' | 'importing' | 'checking' | 'playing' | 'ok' | 'error';

export function MotionPanel() {
  const doc = useEditor((s) => s.doc);
  const projectId = useEditor((s) => s.projectId);
  const show = presentationOf(doc);
  const current = show.musicSource ?? show.musicUrl ?? '';
  const [tick, setTick] = useState(0);
  const [draft, setDraft] = useState(current);
  const [status, setStatus] = useState<MusicStatus>(show.musicUrl ? 'ok' : 'idle');
  const [problem, setProblem] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const importing = useRef(false);

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

  const fail = (message: string) => {
    setProblem(message);
    setStatus('error');
  };

  /** Plays the stored song so the person hears straight away that it works. */
  const play = (src: string, autoplay: boolean) => {
    audio.current?.pause();
    const a = new Audio(src);
    audio.current = a;
    a.volume = 0.7;
    a.addEventListener('error', () => fail('This song couldn’t be played. Try an MP3 file.'), { once: true });
    if (!autoplay) {
      setStatus('ok');
      return;
    }
    setStatus('checking');
    a.play()
      .then(() => setStatus('playing'))
      // Some browsers won't start sound after a wait; the song is saved either way.
      .catch((e: unknown) => (e instanceof DOMException && e.name === 'NotAllowedError' ? setStatus('ok') : fail('This song couldn’t be played. Try an MP3 file.')));
  };

  /**
   * Adds the song: links from Google Drive, Dropbox or anywhere else are
   * copied to our storage once, so the album always plays it reliably.
   */
  const applyMusic = async (autoplay: boolean) => {
    const link = draft.trim();
    setProblem(null);
    if (!link) {
      audio.current?.pause();
      update({ musicUrl: null, musicSource: null });
      setStatus('idle');
      return;
    }
    if (show.musicUrl && link === current) {
      play(show.musicUrl, autoplay);
      return;
    }
    if (!/^https?:\/\//i.test(link)) return fail('Paste the full link, starting with https://');
    if (importing.current) return;
    importing.current = true;
    audio.current?.pause();
    setStatus('importing');
    const res = await fetch(`/api/projects/${projectId}/music`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link }) }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    importing.current = false;
    if (!res?.ok || !data?.url) return fail(data?.error ?? 'We couldn’t add that song. Check your connection and try again.');
    update({ musicUrl: data.url, musicSource: link });
    play(data.url, autoplay);
  };

  const remove = () => {
    audio.current?.pause();
    setDraft('');
    setStatus('idle');
    setProblem(null);
    update({ musicUrl: null, musicSource: null });
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
        <p className="mt-1 text-xs text-muted">Paste a link to a song — Google Drive, Dropbox or any MP3 link. It starts playing when someone opens your album.</p>
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            inputMode="url"
            placeholder="https://drive.google.com/file/d/…"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (status === 'error') {
                setStatus('idle');
                setProblem(null);
              }
            }}
            onBlur={() => {
              if (draft.trim() !== current && status !== 'importing') void applyMusic(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void applyMusic(true);
            }}
            disabled={status === 'importing'}
            className="input input-sm min-w-0 flex-1"
            aria-label="Music link"
          />
          {status === 'playing' ? (
            <button type="button" onClick={stop} className="btn btn-secondary btn-sm !px-2.5" aria-label="Stop">
              <Pause size={14} />
            </button>
          ) : (
            <button type="button" onClick={() => void applyMusic(true)} disabled={!draft.trim() || status === 'importing'} className="btn btn-primary btn-sm !px-2.5" aria-label="Play and use this music">
              {status === 'importing' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            </button>
          )}
        </div>
        <p className="mt-2 min-h-[1rem] text-xs" aria-live="polite">
          {status === 'importing' && <span className="text-muted">Adding your song — this takes a few seconds…</span>}
          {status === 'checking' && <span className="text-muted">Starting the song…</span>}
          {status === 'playing' && <span className="text-success">Playing — this is the music your album opens with.</span>}
          {status === 'ok' && show.musicUrl && <span className="text-success">Music added. It plays when the album opens.</span>}
          {status === 'error' && <span className="text-danger">{problem ?? 'This song couldn’t be played. Try an MP3 file.'}</span>}
        </p>
        {show.musicUrl && (
          <button type="button" onClick={remove} className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-danger">
            <X size={12} /> Remove music
          </button>
        )}
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-faint">
          From Google Drive: open the song (not a folder) → Share → set “Anyone with the link” → Copy link. Only use music you have the right to share.
        </p>
      </section>

      <Link href={`/projects/${projectId}/preview`} className="btn btn-secondary w-full text-[0.75rem] uppercase tracking-[0.16em]">
        <Eye size={14} /> Watch the album
      </Link>
    </div>
  );
}
