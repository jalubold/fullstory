'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check, Copy, Download, Link2, Loader2, Share2, Trash2 } from 'lucide-react';
import type { Locale } from '@/lib/compat/i18n';
import { track, type CompatEvent } from '@/lib/compat/track';
import { UI } from '@/lib/compat/ui-strings';

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5c0-5.2 4.23-9.42 9.43-9.42a9.37 9.37 0 0 1 9.42 9.43c0 5.2-4.23 9.42-9.44 9.42m8.02-17.44A11.3 11.3 0 0 0 12.05.75C5.8.75.7 5.84.7 12.1c0 2 .52 3.95 1.52 5.67L.6 23.25l5.6-1.47a11.3 11.3 0 0 0 5.84 1.6h.01c6.25 0 11.35-5.1 11.35-11.35 0-3.03-1.18-5.88-3.33-8.02" />
    </svg>
  );
}

const noopSubscribe = () => () => {};

function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  };
  return { copied, copy };
}

function ShareButtons({ url, text, events, locale }: { url: string; text: string; events: { copy: CompatEvent; whatsapp: CompatEvent; share: CompatEvent }; locale: Locale }) {
  const t = UI[locale].invite;
  const { copied, copy } = useCopy();
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === 'function',
    () => false,
  );
  const message = `${text} ${url}`;
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track(events.whatsapp)}
        className="awc-btn bg-[#1f8f4e] text-white hover:bg-[#187a42]"
      >
        <WhatsAppIcon /> {t.whatsapp}
      </a>
      {canShare ? (
        <button
          type="button"
          className="awc-btn awc-btn-secondary"
          onClick={async () => {
            try {
              await navigator.share({ text, url });
              track(events.share);
            } catch {
              // Dismissed.
            }
          }}
        >
          <Share2 size={17} aria-hidden /> {t.share}
        </button>
      ) : (
        <button
          type="button"
          className="awc-btn awc-btn-secondary"
          onClick={() => {
            void copy(url);
            track(events.copy);
          }}
        >
          {copied ? <Check size={17} aria-hidden /> : <Copy size={17} aria-hidden />} {copied ? t.linkCopied : t.copyLink}
        </button>
      )}
    </div>
  );
}

/** The invitation: copy, WhatsApp or native share. */
export function InviteCard({ inviteUrl, locale }: { inviteUrl: string; locale: Locale }) {
  const t = UI[locale].invite;
  const { copied, copy } = useCopy();
  const text = t.message;
  return (
    <div className="awc-card p-5 sm:p-6">
      <p className="awc-eyebrow">{t.eyebrow}</p>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-awc-line bg-awc-cream p-1.5 pl-3.5">
        <Link2 size={16} className="shrink-0 text-awc-muted" aria-hidden />
        <input readOnly value={inviteUrl} aria-label={t.linkLabel} className="min-w-0 flex-1 truncate bg-transparent text-sm text-awc-ink-soft outline-none" onFocus={(e) => e.currentTarget.select()} />
        <button
          type="button"
          onClick={() => {
            void copy(inviteUrl);
            track('compat_invite_copy');
          }}
          className="awc-btn awc-btn-primary min-h-0 shrink-0 px-4 py-2 text-sm"
        >
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />} {copied ? t.copied : t.copy}
        </button>
      </div>
      <div className="mt-3">
        <ShareButtons url={inviteUrl} text={text} locale={locale} events={{ copy: 'compat_invite_copy', whatsapp: 'compat_invite_whatsapp', share: 'compat_invite_share' }} />
      </div>
      <p className="mt-4 text-[0.8125rem] leading-relaxed text-awc-muted">{t.note}</p>
    </div>
  );
}

/** Keeps the waiting screen fresh: polls progress and refreshes when something changes. */
export function StatusPoller({ token, snapshot }: { token: string; snapshot: string }) {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    let delay = 4000;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState === 'visible') {
        try {
          const res = await fetch(`/api/compat/p/${token}`, { cache: 'no-store' });
          if (res.ok) {
            const s = await res.json();
            if (`${s.stage}:${s.partnerJoined}:${s.partnerSubmitted}:${s.unlocked}` !== snapshot) {
              router.refresh();
              return;
            }
          }
        } catch {
          // Offline: try again later.
        }
        delay = Math.min(delay * 1.25, 20000);
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, delay);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        delay = 4000;
        void tick();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, snapshot, router]);
  return null;
}

/** "Your private link" — there's no account, so this is how you come back. */
export function PrivateLink({ url, locale }: { url: string; locale: Locale }) {
  const t = UI[locale].privateLink;
  const { copied, copy } = useCopy();
  return (
    <div className="rounded-2xl border border-dashed border-awc-line-strong p-4 sm:p-5">
      <p className="text-sm font-semibold text-awc-ink">{t.title}</p>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-awc-muted">{t.body}</p>
      <button type="button" onClick={() => void copy(url)} className="awc-btn awc-btn-secondary mt-3 min-h-0 w-full px-4 py-2.5 text-sm sm:w-auto">
        {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />} {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}

export function UnlockButton({ token, label, locale, className = '', tone = 'primary' }: { token: string; label: string; locale: Locale; className?: string; tone?: 'primary' | 'light' }) {
  const t = UI[locale].offer;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          track('compat_checkout_click');
          try {
            const res = await fetch(`/api/compat/p/${token}/checkout`, { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error ?? t.error);
            if (data.unlocked) {
              router.push(`/compatible/s/${token}/blueprint`);
              return;
            }
            window.location.href = data.url;
          } catch (e) {
            setError(e instanceof Error ? e.message : t.error);
            setBusy(false);
          }
        }}
        className={`awc-btn ${tone === 'light' ? 'awc-btn-light' : 'awc-btn-primary'} w-full px-7 text-base sm:w-auto`}
      >
        {busy && <Loader2 size={18} className="animate-spin" aria-hidden />}
        {busy ? t.opening : label}
      </button>
      {error && <p className={`mt-3 text-sm ${tone === 'light' ? 'text-white' : 'text-[#a3302a]'}`} role="alert">{error}</p>}
    </div>
  );
}

/** Basic result sharing: the headline only — never answers or names of anyone but the sender’s choosing. */
export function ShareResult({ text, url, locale }: { text: string; url: string; locale: Locale }) {
  return <ShareButtons url={url} text={text} locale={locale} events={{ copy: 'compat_result_share', whatsapp: 'compat_result_share', share: 'compat_result_share' }} />;
}

export function PdfLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} onClick={() => track('compat_pdf_download')} className="awc-btn awc-btn-secondary min-h-0 px-4 py-2.5 text-sm">
      <Download size={16} aria-hidden /> {label}
    </a>
  );
}

export function DeleteData({ token, partnerName, locale }: { token: string; partnerName: string | null; locale: Locale }) {
  const t = UI[locale].del;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm text-awc-muted underline-offset-4 hover:text-[#a3302a] hover:underline">
        <Trash2 size={15} aria-hidden /> {t.button}
      </button>
    );
  }
  return (
    <div className="rounded-2xl border border-[#e9c3bf] bg-[#fdf3f2] p-4 sm:p-5" role="alertdialog" aria-labelledby="awc-del-title">
      <p id="awc-del-title" className="font-semibold text-awc-ink">{t.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-awc-ink-soft">{t.body(partnerName)}</p>
      {error && <p className="mt-2 text-sm text-[#a3302a]" role="alert">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const res = await fetch(`/api/compat/p/${token}`, { method: 'DELETE' });
              if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? t.error);
              track('compat_delete');
              router.replace('/compatible?deleted=1');
            } catch (e) {
              setError(e instanceof Error ? e.message : t.error);
              setBusy(false);
            }
          }}
          className="awc-btn min-h-0 bg-[#a3302a] px-4 py-2.5 text-sm text-white hover:bg-[#8a2721]"
        >
          {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Trash2 size={15} aria-hidden />} {t.confirm}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="awc-btn awc-btn-ghost min-h-0 px-4 py-2.5 text-sm">
          {t.cancel}
        </button>
      </div>
    </div>
  );
}

export function TrackView({ event, props }: { event: CompatEvent; props?: Record<string, string | number | boolean> }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(event, props);
  }, [event, props]);
  return null;
}
