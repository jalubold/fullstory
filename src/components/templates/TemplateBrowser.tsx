'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export interface BrowserItem {
  id: string;
  name: string;
  category: string;
  style: string;
  orientation: string;
  tier: 'free' | 'premium';
  pageCount: number;
  photoSlots: number;
  text: string;
  rank: number;
  node: ReactNode;
}

interface Option {
  id: string;
  label: string;
}

interface Props {
  items: BrowserItem[];
  categories: Option[];
  styles: Option[];
  lockedCategory?: string;
}

type Filters = {
  q: string;
  category: string[];
  style: string[];
  orientation: string[];
  tier: string;
  sort: string;
};

const ORIENTATIONS: Option[] = [
  { id: 'square', label: 'Square' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'portrait', label: 'Portrait' },
];
const TIERS: Option[] = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'premium', label: 'Premium' },
];
const EMPTY: Filters = { q: '', category: [], style: [], orientation: [], tier: 'all', sort: 'featured' };
const LIST_KEYS = ['category', 'style', 'orientation'] as const;

function parse(search: string): Filters {
  const p = new URLSearchParams(search);
  const f: Filters = { ...EMPTY, q: p.get('q') ?? '', tier: p.get('tier') ?? 'all', sort: p.get('sort') ?? 'featured' };
  for (const k of LIST_KEYS) f[k] = p.get(k)?.split(',').filter(Boolean) ?? [];
  return f;
}

function serialize(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  for (const k of LIST_KEYS) if (f[k].length) p.set(k, f[k].join(','));
  if (f.tier !== 'all') p.set('tier', f.tier);
  if (f.sort !== 'featured') p.set('sort', f.sort);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/**
 * One calm toolbar for every screen: search, occasion chips, and a single
 * "Filters" button for the rarer choices (style, shape, price). No sidebar,
 * so the designs get the whole width.
 */
export function TemplateBrowser({ items, categories, styles, lockedCategory }: Props) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    // Read deep-link filters once on mount; avoid a Suspense boundary for search params.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF(parse(window.location.search));
  }, []);

  useEffect(() => {
    const qs = serialize(f);
    if (qs !== window.location.search && !(qs === '' && window.location.search === '')) {
      window.history.replaceState(null, '', `${window.location.pathname}${qs}`);
    }
  }, [f]);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheet]);

  const toggle = (key: (typeof LIST_KEYS)[number], id: string) =>
    setF((prev) => ({ ...prev, [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id] }));

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const out = items.filter((it) => {
      if (q && !it.text.includes(q)) return false;
      if (f.category.length && !f.category.includes(it.category)) return false;
      if (f.style.length && !f.style.includes(it.style)) return false;
      if (f.orientation.length && !f.orientation.includes(it.orientation)) return false;
      if (f.tier !== 'all' && it.tier !== f.tier) return false;
      return true;
    });
    const sorted = [...out];
    if (f.sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (f.sort === 'photos-asc') sorted.sort((a, b) => a.photoSlots - b.photoSlots);
    else if (f.sort === 'photos-desc') sorted.sort((a, b) => b.photoSlots - a.photoSlots);
    else sorted.sort((a, b) => a.rank - b.rank);
    return sorted;
  }, [items, f]);

  // Occasion is chosen with the chips; the rest live behind "Filters".
  const active: Array<{ key: keyof Filters; id: string; label: string }> = [];
  const label = (opts: Option[], id: string) => opts.find((o) => o.id === id)?.label ?? id;
  f.style.forEach((id) => active.push({ key: 'style', id, label: label(styles, id) }));
  f.orientation.forEach((id) => active.push({ key: 'orientation', id, label: label(ORIENTATIONS, id) }));
  if (f.tier !== 'all') active.push({ key: 'tier', id: f.tier, label: f.tier === 'free' ? 'Free' : 'Premium' });

  const removeActive = (a: (typeof active)[number]) => {
    if (a.key === 'tier') setF((p) => ({ ...p, tier: 'all' }));
    else toggle(a.key as (typeof LIST_KEYS)[number], a.id);
  };

  const occasions = categories.filter((c) => items.some((i) => i.category === c.id));
  const chip = (on: boolean) =>
    `h-9 shrink-0 rounded-full border px-4 text-[13px] sm:px-3.5 font-medium transition-colors active:scale-95 ${on ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-white text-ink-soft hover:border-ink hover:text-ink'}`;

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search designs</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={f.q}
            onChange={(e) => setF((p) => ({ ...p, q: e.target.value }))}
            placeholder="Search designs"
            className="input h-11 !pl-10"
          />
        </label>
        <button type="button" className="btn btn-secondary h-11 shrink-0 gap-2 px-4" onClick={() => setSheet(true)} aria-haspopup="dialog" aria-label={active.length ? `Filters (${active.length})` : "Filters"}>
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {active.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">{active.length}</span>}
        </button>
        <label className="hidden shrink-0 items-center sm:flex">
          <span className="sr-only">Sort</span>
          <select value={f.sort} onChange={(e) => setF((p) => ({ ...p, sort: e.target.value }))} className="input h-11 !w-auto !py-0 !pr-9">
            <option value="featured">Featured first</option>
            <option value="name">Name A–Z</option>
            <option value="photos-asc">Fewest photos</option>
            <option value="photos-desc">Most photos</option>
          </select>
        </label>
      </div>

      {!lockedCategory && occasions.length > 1 && (
        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Occasion">
          {[{ id: '', label: 'All' }, ...occasions].map((c) => {
            const on = c.id ? f.category.includes(c.id) : f.category.length === 0;
            return (
              <button key={c.id || 'all'} type="button" aria-pressed={on} onClick={() => setF((p) => ({ ...p, category: c.id && !on ? [c.id] : [] }))} className={chip(on)}>
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {(active.length > 0 || f.q) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="mr-1 text-sm text-muted" aria-live="polite">
            {results.length} {results.length === 1 ? 'design' : 'designs'}
          </p>
          {active.map((a) => (
            <button key={`${a.key}-${a.id}`} type="button" onClick={() => removeActive(a)} className="badge border border-line-strong bg-white !py-1 text-ink-soft hover:border-ink">
              {a.label} <X size={12} />
            </button>
          ))}
          {active.length > 0 && (
            <button type="button" className="text-xs text-muted underline underline-offset-2 hover:text-ink" onClick={() => setF((p) => ({ ...p, style: [], orientation: [], tier: 'all' }))}>
              Clear
            </button>
          )}
        </div>
      )}

      {results.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-8 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3">
          {results.map((it) => (
            <div key={it.id}>{it.node}</div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[12px] border border-dashed border-line-strong bg-white/60 px-6 py-14 text-center">
          <p className="font-serif text-2xl">Nothing matches yet.</p>
          <p className="mt-2 text-sm text-muted">Try fewer filters or a broader word.</p>
          <button type="button" className="btn btn-secondary btn-sm mt-6" onClick={() => setF(EMPTY)}>
            Show all designs
          </button>
        </div>
      )}

      {sheet && (
        <div className="fixed inset-0 z-[70] lg:grid lg:place-items-center lg:p-6" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="animate-fade-in absolute inset-0 bg-ink/35" aria-label="Close filters" onClick={() => setSheet(false)} />
          <div className="animate-sheet-up absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[18px] bg-paper shadow-pop lg:relative lg:inset-auto lg:w-full lg:max-w-md lg:rounded-[14px]">
            <span aria-hidden className="mx-auto mt-2.5 block h-1 w-10 shrink-0 rounded-full bg-line-strong lg:hidden" />
            <div className="flex shrink-0 items-center justify-between px-6 pb-2 pt-3 lg:pt-5">
              <p className="font-serif text-2xl">Filters</p>
              <button type="button" className="-mr-2 grid h-10 w-10 place-items-center text-muted hover:text-ink" onClick={() => setSheet(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 pb-4 pt-2">
              <FilterGroup title="Style">
                {styles.map((s) => (
                  <button key={s.id} type="button" className={chip(f.style.includes(s.id))} aria-pressed={f.style.includes(s.id)} onClick={() => toggle('style', s.id)}>
                    {s.label}
                  </button>
                ))}
              </FilterGroup>
              <FilterGroup title="Shape">
                {ORIENTATIONS.map((o) => (
                  <button key={o.id} type="button" className={chip(f.orientation.includes(o.id))} aria-pressed={f.orientation.includes(o.id)} onClick={() => toggle('orientation', o.id)}>
                    {o.label}
                  </button>
                ))}
              </FilterGroup>
              <FilterGroup title="Price">
                {TIERS.map((o) => (
                  <button key={o.id} type="button" className={chip(f.tier === o.id)} aria-pressed={f.tier === o.id} onClick={() => setF((p) => ({ ...p, tier: o.id }))}>
                    {o.label}
                  </button>
                ))}
              </FilterGroup>
              <FilterGroup title="Sort" className="sm:hidden">
                {[
                  ['featured', 'Featured'],
                  ['name', 'A–Z'],
                  ['photos-asc', 'Fewest photos'],
                  ['photos-desc', 'Most photos'],
                ].map(([id, l]) => (
                  <button key={id} type="button" className={chip(f.sort === id)} aria-pressed={f.sort === id} onClick={() => setF((p) => ({ ...p, sort: id }))}>
                    {l}
                  </button>
                ))}
              </FilterGroup>
            </div>
            <div className="flex shrink-0 gap-3 border-t border-line px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:pb-5">
              <button type="button" className="btn btn-ghost h-12 px-4" onClick={() => setF((p) => ({ ...p, style: [], orientation: [], tier: 'all', sort: 'featured' }))}>
                Reset
              </button>
              <button type="button" className="btn btn-primary h-12 flex-1" onClick={() => setSheet(false)}>
                Show {results.length} {results.length === 1 ? 'design' : 'designs'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={className}>
      <legend className="smallcaps mb-3">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
