import type { CSSProperties, ReactNode } from 'react';
import { Check, Puzzle, Equal, ArrowLeftRight, MessageCircleWarning, MoveHorizontal } from 'lucide-react';
import type { Locale } from '@/lib/compat/i18n';
import type { AxisView, Evidence, Insight } from '@/lib/compat/report';
import { relationLabels } from '@/lib/compat/report';
import type { Relation } from '@/lib/compat/types';
import { UI } from '@/lib/compat/ui-strings';

/* Person A = wine, Person B = slate; always paired with an initial and a name. */
export const PERSON_COLOR = { a: 'var(--color-awc-wine)', b: 'var(--color-awc-slate)' } as const;

export const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();

export function PersonDot({ role, name, size = 'md' }: { role: 'a' | 'b'; name: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-5 w-5 text-[0.625rem]' : 'h-7 w-7 text-xs';
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white ${s}`} style={{ background: PERSON_COLOR[role] }}>
      {initial(name)}
    </span>
  );
}

/** Headline number: overall alignment as a ring. A single value, so no legend — the label names it. */
export function ScoreRing({ value, label = 'aligned', size = 168 }: { value: number; label?: string; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${value}% ${label}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-awc-blush-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-awc-wine)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="awc-ring-arc"
          style={{ '--awc-ring-full': c } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="awc-serif text-[2.9rem] leading-none tabular-nums" style={{ fontSize: size * 0.28 }}>
          {value}
          <span className="align-top text-[0.45em] text-awc-muted">%</span>
        </span>
        <span className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-awc-muted">{label}</span>
      </div>
    </div>
  );
}

/** Five dimension scores. Magnitude in one hue, value printed beside every bar. */
export function DimensionBars({ items, dense = false }: { items: Array<{ id: string; label: string; alignment: number; headline?: string }>; dense?: boolean }) {
  return (
    <ul className={dense ? 'space-y-3' : 'space-y-5'}>
      {items.map((d, i) => (
        <li key={d.id}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[0.9375rem] font-semibold text-awc-ink">{d.label}</span>
            <span className="awc-serif text-lg tabular-nums text-awc-ink">{d.alignment}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-awc-blush-soft" role="img" aria-label={`${d.label}: ${d.alignment}% aligned`}>
            <div className="awc-bar-fill h-full rounded-full bg-awc-wine" style={{ width: `${d.alignment}%`, animationDelay: `${250 + i * 90}ms` }} />
          </div>
          {d.headline && !dense && <p className="mt-1.5 text-[0.8125rem] text-awc-muted">{d.headline}</p>}
        </li>
      ))}
    </ul>
  );
}

const RELATION_STYLE: Record<Relation, { cls: string; Icon: typeof Check }> = {
  shared: { cls: 'bg-awc-sage-soft text-awc-sage', Icon: Equal },
  close: { cls: 'bg-awc-sage-soft text-awc-sage', Icon: MoveHorizontal },
  complementary: { cls: 'bg-awc-blush-soft text-awc-wine-dark', Icon: Puzzle },
  different: { cls: 'bg-awc-cream-2 text-awc-ink-soft', Icon: ArrowLeftRight },
  tension: { cls: 'bg-awc-amber-soft text-awc-amber', Icon: MessageCircleWarning },
};

export function RelationChip({ relation, blindSpot = false, locale }: { relation: Relation; blindSpot?: boolean; locale: Locale }) {
  if (blindSpot) {
    return (
      <span className="awc-chip bg-awc-amber-soft text-awc-amber">
        <MessageCircleWarning size={12} aria-hidden /> {UI[locale].blueprint.sharedBlindSpot}
      </span>
    );
  }
  const { cls, Icon } = RELATION_STYLE[relation];
  return (
    <span className={`awc-chip ${cls}`}>
      <Icon size={12} aria-hidden /> {relationLabels(locale)[relation]}
    </span>
  );
}

/** Both answers, side by side — the evidence behind an insight. */
export function EvidenceBlock({ evidence, names }: { evidence: Evidence; names: { a: string; b: string } }) {
  return (
    <div className="mt-4 rounded-2xl bg-awc-cream p-3.5 sm:p-4">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted">{evidence.prompt}</p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {(['a', 'b'] as const).map((r) => (
          <div key={r} className="flex items-start gap-2.5">
            <PersonDot role={r} name={names[r]} size="sm" />
            <p className="text-[0.875rem] leading-snug text-awc-ink">
              <span className="font-semibold">{names[r]}:</span> {evidence[r]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsightCard({ insight, names, locale, index, showTip = true, footer }: { insight: Insight; names: { a: string; b: string }; locale: Locale; index?: number; showTip?: boolean; footer?: ReactNode }) {
  const blind = insight.id.startsWith('blind-');
  return (
    <article className="awc-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {index !== undefined && <span className="awc-numeral text-2xl">{String(index + 1).padStart(2, '0')}</span>}
        <h3 className="awc-serif text-[1.35rem] leading-tight text-awc-ink">{insight.title}</h3>
        {insight.relation && <span className="sm:ml-auto"><RelationChip relation={insight.relation} blindSpot={blind && insight.relation === 'shared'} locale={locale} /></span>}
      </div>
      <div className="awc-prose mt-3 text-[0.98rem] leading-relaxed text-awc-ink-soft">
        {insight.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {showTip && insight.tip && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-awc-blush bg-awc-blush-soft/50 p-3.5 text-[0.9rem] leading-relaxed text-awc-ink">
          <span className="awc-eyebrow mt-0.5 shrink-0">{UI[locale].blueprint.try}</span>
          <p>{insight.tip}</p>
        </div>
      )}
      {insight.evidence?.map((e, i) => (
        <EvidenceBlock key={i} evidence={e} names={names} />
      ))}
      {footer}
    </article>
  );
}

/** One axis, two people: where each sits between two poles. Legend = initials + names in the parent. */
export function AxisSpectrum({ axis, names, locale }: { axis: AxisView; names: { a: string; b: string }; locale: Locale }) {
  const pos = (v: number | null) => `${((Math.max(-1, Math.min(1, v ?? 0)) + 1) / 2) * 100}%`;
  const close = axis.a !== null && axis.b !== null && Math.abs(axis.a - axis.b) < 0.12;
  return (
    <div>
      <p className="text-[0.8125rem] font-semibold text-awc-ink">{axis.label}</p>
      <div className="relative mt-3 h-8">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-awc-line-strong" />
        <div className="absolute left-1/2 top-1/2 h-2.5 w-px -translate-y-1/2 bg-awc-line-strong" />
        {(['a', 'b'] as const).map((r) => (
          <div
            key={r}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700"
            style={{ left: pos(axis[r]), marginTop: close ? (r === 'a' ? -9 : 9) : 0 }}
            title={`${names[r]}: ${axis[r] === null ? '–' : axis[r]! > 0.15 ? axis.right : axis[r]! < -0.15 ? axis.left : UI[locale].blueprint.inBetween}`}
          >
            <PersonDot role={r} name={names[r]} size="sm" />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.75rem] text-awc-muted">
        <span>{axis.left}</span>
        <span>{axis.right}</span>
      </div>
    </div>
  );
}

export function PeopleLegend({ names }: { names: { a: string; b: string } }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-awc-ink-soft">
      {(['a', 'b'] as const).map((r) => (
        <span key={r} className="inline-flex items-center gap-2">
          <PersonDot role={r} name={names[r]} size="sm" />
          {names[r]}
        </span>
      ))}
    </div>
  );
}
