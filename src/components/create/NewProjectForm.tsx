'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { CatalogSize } from '@/lib/commerce/catalog';

interface Props {
  templateId: string | null;
  defaultTitle: string;
  sizes: CatalogSize[];
  orientationChoice: boolean;
  pages: { min: number; max: number; step: number; default: number };
}

export function NewProjectForm({ templateId, defaultTitle, sizes, orientationChoice, pages }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultTitle);
  const [orientation, setOrientation] = useState(sizes[0]?.orientation ?? 'square');
  const visible = orientationChoice ? sizes.filter((s) => s.orientation === orientation) : sizes;
  const [sizeId, setSizeId] = useState(visible[0]?.id ?? '');
  const [pageCount, setPageCount] = useState(pages.default);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, sizeId, title: title.trim() || defaultTitle, pageCount }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(data.error ?? 'Something went wrong. Please try again.');
      return;
    }
    router.push(`/projects/${data.id}/photos`);
  };

  return (
    <form onSubmit={submit} className="space-y-7">
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
      <div>
        <label className="label" htmlFor="title">Album name</label>
        <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        <p className="mt-1.5 text-xs text-muted">Only you see this name. You can change it any time.</p>
      </div>
      {orientationChoice && (
        <fieldset>
          <legend className="label">Shape</legend>
          <div className="grid grid-cols-3 gap-3">
            {(['square', 'landscape', 'portrait'] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  setOrientation(o);
                  setSizeId(sizes.find((s) => s.orientation === o)?.id ?? '');
                }}
                aria-pressed={orientation === o}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm ${orientation === o ? 'border-ink bg-white' : 'border-line-strong hover:border-ink/50'}`}
              >
                <span className="block bg-paper-3" style={{ width: o === 'portrait' ? 28 : 40, height: o === 'landscape' ? 28 : 40 }} />
                {o[0].toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="label">Book size</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {visible.map((s) => (
            <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${sizeId === s.id ? 'border-ink bg-white' : 'border-line-strong hover:border-ink/50'}`}>
              <input type="radio" name="size" value={s.id} checked={sizeId === s.id} onChange={() => setSizeId(s.id)} className="accent-[#25231f]" />
              <span>
                <span className="font-medium">{s.label}</span> <span className="text-muted">· {s.metricLabel}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">You can still choose softcover, hardcover or a digital edition at checkout.</p>
      </fieldset>
      {!templateId && (
        <div>
          <label className="label" htmlFor="pages">Number of pages</label>
          <select id="pages" className="input" value={pageCount} onChange={(e) => setPageCount(+e.target.value)}>
            {Array.from({ length: Math.floor((Math.min(pages.max, 60) - pages.min) / pages.step) + 1 }, (_, i) => pages.min + i * pages.step).map((n) => (
              <option key={n} value={n}>{n} pages</option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" disabled={busy || !sizeId} className="btn btn-primary btn-lg w-full">
        {busy ? <Loader2 size={16} className="animate-spin" /> : null} Create my album <ArrowRight size={16} />
      </button>
    </form>
  );
}
