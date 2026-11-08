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
  sizes: string[];
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
  sizes: Option[];
  lockedCategory?: string;
}

type Filters = {
  q: string;
  category: string[];
  style: string[];
  orientation: string[];
  size: string[];
  pages: string[];
  tier: string;
  sort: string;
};

const ORIENTATIONS: Option[] = [
  { id: 'square', label: 'Square' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'portrait', label: 'Portrait' },
];
const PAGE_BUCKETS: Array<Option & { test: (n: number) => boolean }> = [
  { id: 'short', label: 'Up to 20 pages', test: (n) => n <= 20 },
  { id: 'medium', label: '22–28 pages', test: (n) => n > 20 && n <= 28 },
  { id: 'long', label: '30+ pages', test: (n) => n >= 30 },
];
const EMPTY: Filters = { q: '', category: [], style: [], orientation: [], size: [], pages: [], tier: 'all', sort: 'featured' };
const LIST_KEYS = ['category', 'style', 'orientation', 'size', 'pages'] as const;

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

export function TemplateBrowser({ items, categories, styles, sizes, lockedCategory }: Props) {
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

  const toggle = (key: (typeof LIST_KEYS)[number], id: string) =>
    setF((prev) => ({ ...prev, [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id] }));

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const out = items.filter((it) => {
      if (q && !it.text.includes(q)) return false;
      if (f.category.length && !f.category.includes(it.category)) return false;
      if (f.style.length && !f.style.includes(it.style)) return false;
      if (f.orientation.length && !f.orientation.includes(it.orientation)) return false;
      if (f.size.length && !it.sizes.some((s) => f.size.includes(s))) return false;
      if (f.pages.length && !PAGE_BUCKETS.filter((b) => f.pages.includes(b.id)).some((b) => b.test(it.pageCount))) return false;
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

  const active: Array<{ key: keyof Filters; id: string; label: string }> = [];
  const label = (opts: Option[], id: string) => opts.find((o) => o.id === id)?.label ?? id;
  f.category.forEach((id) => active.push({ key: 'category', id, label: label(categories, id) }));
  f.style.forEach((id) => active.push({ key: 'style', id, label: label(styles, id) }));
  f.orientation.forEach((id) => active.push({ key: 'orientation', id, label: label(ORIENTATIONS, id) }));
  f.size.forEach((id) => active.push({ key: 'size', id, label: label(sizes, id) }));
  f.pages.forEach((id) => active.push({ key: 'pages', id, label: label(PAGE_BUCKETS, id) }));
  if (f.tier !== 'all') active.push({ key: 'tier', id: f.tier, label: f.tier === 'free' ? 'Free' : 'Premium' });

  const removeActive = (a: (typeof active)[number]) => {
    if (a.key === 'tier') setF((p) => ({ ...p, tier: 'all' }));
    else toggle(a.key as (typeof LIST_KEYS)[number], a.id);
  };

  const filterPanel = (
    <div className="space-y-8">
      {!lockedCategory && (
        <FilterGroup title="Category">
          {categories.map((c) => (
            <Check key={c.id} checked={f.category.includes(c.id)} onChange={() => toggle('category', c.id)} label={c.label} count={items.filter((i) => i.category === c.id).length} />
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Design style">
        <div className="flex flex-wrap gap-2">
          {styles.map((s) => (
            <button key={s.id} type="button" className="chip !px-3 !py-1.5 !text-xs" aria-pressed={f.style.includes(s.id)} onClick={() => toggle('style', s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Orientation">
        {ORIENTATIONS.map((o) => (
          <Check key={o.id} checked={f.orientation.includes(o.id)} onChange={() => toggle('orientation', o.id)} label={o.label} />
        ))}
      </FilterGroup>
      <FilterGroup title="Book size">
        {sizes.map((s) => (
          <Check key={s.id} checked={f.size.includes(s.id)} onChange={() => toggle('size', s.id)} label={s.label} />
        ))}
      </FilterGroup>
      <FilterGroup title="Page count">
        {PAGE_BUCKETS.map((b) => (
          <Check key={b.id} checked={f.pages.includes(b.id)} onChange={() => toggle('pages', b.id)} label={b.label} count={items.filter((i) => b.test(i.pageCount)).length} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="flex gap-2">
          {[
            ['all', 'All'],
            ['free', 'Free'],
            ['premium', 'Premium'],
          ].map(([id, l]) => (
            <button key={id} type="button" className="chip !px-3 !py-1.5 !text-xs" aria-pressed={f.tier === id} onClick={() => setF((p) => ({ ...p, tier: id }))}>
              {l}
            </button>
          ))}
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-8 pr-2 scrollbar-thin">{filterPanel}</div>
      </aside>
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search templates</span>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={f.q}
              onChange={(e) => setF((p) => ({ ...p, q: e.target.value }))}
              placeholder="Search by name, occasion or style…"
              className="input !rounded-full !pl-10"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm lg:hidden" onClick={() => setSheet(true)}>
              <SlidersHorizontal size={15} /> Filters{active.length ? ` (${active.length})` : ''}
            </button>
            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">Sort</span>
              <select value={f.sort} onChange={(e) => setF((p) => ({ ...p, sort: e.target.value }))} className="input input-sm !w-auto !rounded-full !py-2 !pr-8">
                <option value="featured">Featured</option>
                <option value="name">Name A–Z</option>
                <option value="photos-asc">Fewest photos</option>
                <option value="photos-desc">Most photos</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 flex min-h-8 flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-muted" aria-live="polite">
            {results.length} {results.length === 1 ? 'template' : 'templates'}
          </p>
          {active.map((a) => (
            <button key={`${a.key}-${a.id}`} type="button" onClick={() => removeActive(a)} className="badge border border-line-strong bg-white !py-1 text-ink-soft hover:border-ink">
              {a.label} <X size={12} />
            </button>
          ))}
          {active.length > 0 && (
            <button type="button" className="text-xs text-muted underline underline-offset-2 hover:text-ink" onClick={() => setF((p) => ({ ...EMPTY, q: p.q }))}>
              Clear all
            </button>
          )}
        </div>

        {results.length ? (
          <div className="mt-6 grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((it) => (
              <div key={it.id}>{it.node}</div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-line-strong bg-white/60 px-6 py-16 text-center">
            <p className="font-serif text-2xl">No templates match those filters.</p>
            <p className="mt-2 text-sm text-muted">Try removing a filter or searching for something broader.</p>
            <button type="button" className="btn btn-secondary btn-sm mt-6" onClick={() => setF(EMPTY)}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="absolute inset-0 bg-ink/30" aria-label="Close filters" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-paper p-6 animate-fade-up">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-serif text-2xl">Filters</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSheet(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {filterPanel}
            <button type="button" className="btn btn-primary mt-8 w-full" onClick={() => setSheet(false)}>
              Show {results.length} templates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{title}</legend>
      <div className="space-y-1.5">{children}</div>
    </fieldset>
  );
}

function Check({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-sm text-ink-soft hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-line-strong accent-accent" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-faint">{count}</span>}
    </label>
  );
}
