import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Heart, HeartHandshake } from 'lucide-react';
import type { Blueprint, DeepDive, Insight } from '@/lib/compat/report';
import { PdfLink, TrackView } from './Actions';
import { AxisSpectrum, DimensionBars, InsightCard, PeopleLegend, PersonDot, RelationChip, ScoreRing } from './Visuals';

export const SECTIONS = [
  { id: 'overview', title: 'Relationship Overview' },
  { id: 'profile-a', title: 'Individual Profile' },
  { id: 'profile-b', title: 'Individual Profile' },
  { id: 'breakdown', title: 'Compatibility Breakdown' },
  { id: 'together', title: 'What Brings You Together' },
  { id: 'differ', title: 'Where You Differ' },
  { id: 'emotional', title: 'Emotional Needs' },
  { id: 'communication', title: 'Communication Dynamics' },
  { id: 'conflict', title: 'Conflict & Understanding' },
  { id: 'future', title: 'Future Expectations' },
  { id: 'strengths', title: 'Relationship Strengths' },
  { id: 'blind-spots', title: 'Potential Blind Spots' },
  { id: 'starters', title: 'Conversation Starters' },
  { id: 'actions', title: 'Practical Action Plan' },
] as const;

const num = (id: string) => String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, '0');

/** Where a single-question insight is covered in depth (null: only in the overview sections). */
function deepDiveFor(i: Insight): (typeof SECTIONS)[number] | null {
  if (i.id === 'life-recharge') return SECTIONS[6];
  const map: Record<string, number> = { emotional: 6, communication: 7, conflict: 8, future: 9 };
  return i.dimension && i.dimension in map ? SECTIONS[map[i.dimension]] : null;
}

function Section({ id, title, kicker, intro, children }: { id: string; title: string; kicker?: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-awc-line-strong pt-10 md:pt-14">
      <div className="flex items-baseline gap-4">
        <span className="awc-numeral text-4xl md:text-5xl">{num(id)}</span>
        <div>
          {kicker && <p className="awc-eyebrow">{kicker}</p>}
          <h2 className="awc-serif text-[1.9rem] leading-tight md:text-[2.4rem]">{title}</h2>
        </div>
      </div>
      {intro && <div className="awc-prose mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-awc-ink-soft">{intro}</div>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Compact summary line for the overview sections; full detail lives in the deep dive. */
function SummaryItem({ insight, names }: { insight: Insight; names: Blueprint['names'] }) {
  const deep = deepDiveFor(insight);
  if (!deep) return <InsightCard insight={insight} names={names} />;
  return (
    <article className="rounded-2xl border border-awc-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="awc-serif text-xl leading-tight">{insight.title}</h3>
        {insight.relation && <span className="sm:ml-auto"><RelationChip relation={insight.relation} /></span>}
      </div>
      <p className="mt-2.5 text-[0.98rem] leading-relaxed text-awc-ink-soft">{insight.body[0]}</p>
      <a href={`#${deep.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-awc-wine hover:text-awc-wine-dark">
        What it means, and what to try: {num(deep.id)} · {deep.title} <ArrowRight size={14} aria-hidden />
      </a>
    </article>
  );
}

function DeepDiveSection({ dive, names }: { dive: DeepDive; names: Blueprint['names'] }) {
  return (
    <Section id={dive.id} title={dive.title} intro={dive.intro.map((p, i) => <p key={i}>{p}</p>)}>
      <div className="space-y-5">
        {dive.items.map((i) => (
          <InsightCard key={i.id} insight={i} names={names} />
        ))}
      </div>
    </Section>
  );
}

function ProfileSection({ bp, role }: { bp: Blueprint; role: 'a' | 'b' }) {
  const p = bp.profiles[role];
  return (
    <Section id={`profile-${role}`} title={`Individual Profile — ${p.name}`}>
      <div className="awc-card overflow-hidden">
        <div className={`flex items-center gap-4 p-6 sm:p-8 ${role === 'a' ? 'bg-awc-blush-soft/70' : 'bg-awc-slate-soft'}`}>
          <PersonDot role={role} name={p.name} />
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-awc-muted">{p.name}</p>
            <p className="awc-serif text-[1.8rem] leading-tight">{p.headline}</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-[1.0625rem] leading-relaxed text-awc-ink">{p.summary}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-awc-cream p-4">
              <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted"><Heart size={13} aria-hidden /> Feels most loved through</p>
              <p className="mt-1.5 text-[0.9375rem] font-semibold text-awc-ink">{p.care.loved}</p>
            </div>
            <div className="rounded-2xl bg-awc-cream p-4">
              <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted"><HeartHandshake size={13} aria-hidden /> Shows care through</p>
              <p className="mt-1.5 text-[0.9375rem] font-semibold text-awc-ink">{p.care.shows}</p>
            </div>
          </div>
          <p className="mt-7 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted">In {p.name}’s own answers</p>
          <ul className="mt-3 divide-y divide-awc-line">
            {p.traits.map((t) => (
              <li key={t} className="flex gap-3 py-2.5 text-[0.9688rem] leading-relaxed text-awc-ink-soft">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: role === 'a' ? 'var(--color-awc-wine)' : 'var(--color-awc-slate)' }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function BlueprintReport({ bp, token, generated }: { bp: Blueprint; token: string; generated: string }) {
  const { names, overview } = bp;
  const horizons = ['This week', 'This month', 'Ongoing'] as const;
  return (
    <div>
      <TrackView event="compat_blueprint_view" />
      {/* Cover */}
      <header className="bg-awc-wine-deep text-white">
        <div className="awc-container py-12 md:py-20">
          <Link href={`/compatible/s/${token}`} className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft size={15} aria-hidden /> Results
          </Link>
          <p className="awc-eyebrow mt-8 !text-awc-blush">The Relationship Blueprint</p>
          <h1 className="awc-serif mt-4 text-[2.9rem] leading-[1.02] sm:text-7xl">
            {names.a} <em className="text-awc-blush">&</em> {names.b}
          </h1>
          <p className="awc-serif mt-5 text-2xl italic text-white/85 sm:text-3xl">{overview.signature.title}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/65">
            <span>{bp.context.label}</span>
            <span>{generated}</span>
            <span>{overview.alignment}% aligned</span>
          </div>
        </div>
      </header>

      {/* Mobile section nav */}
      <nav aria-label="Blueprint sections" className="sticky top-14 z-30 border-b border-awc-line bg-awc-cream/95 backdrop-blur lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-full border border-awc-line bg-white px-3 py-1.5 text-xs font-semibold text-awc-ink-soft">
              {num(s.id)} {s.id === 'profile-a' ? names.a : s.id === 'profile-b' ? names.b : s.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="awc-container grid gap-10 py-10 lg:grid-cols-[15rem_1fr] lg:gap-14 lg:py-16">
        <aside className="hidden lg:block">
          <nav aria-label="Blueprint sections" className="sticky top-24">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-awc-muted">Contents</p>
            <ol className="mt-4 space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-3 rounded-lg px-2 py-1.5 text-sm text-awc-ink-soft hover:bg-white hover:text-awc-wine-dark">
                    <span className="awc-numeral w-5 text-sm">{num(s.id)}</span>
                    {s.id === 'profile-a' ? `Profile — ${names.a}` : s.id === 'profile-b' ? `Profile — ${names.b}` : s.title}
                  </a>
                </li>
              ))}
            </ol>
            <div className="mt-6 px-2">
              <PdfLink href={`/api/compat/p/${token}/blueprint`} />
            </div>
          </nav>
        </aside>

        <div className="min-w-0 max-w-3xl space-y-16">
          <div className="flex flex-wrap items-center justify-between gap-4 lg:hidden">
            <PeopleLegend names={names} />
            <PdfLink href={`/api/compat/p/${token}/blueprint`} />
          </div>

          <Section id="overview" title="Relationship Overview" kicker={overview.signature.tagline}>
            <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
              <div className="flex justify-center">
                <ScoreRing value={overview.alignment} size={180} />
              </div>
              <div>
                <p className="awc-serif text-2xl leading-snug">{overview.signature.description}</p>
                <p className="mt-4 text-sm text-awc-muted">
                  Same answer on {overview.sameAnswers} of {overview.total} questions · {overview.similarity}% similarity · {overview.counts.complementary} complementary · {overview.counts.tension} worth discussing
                </p>
              </div>
            </div>
            <div className="awc-prose mt-8 text-[1.0625rem] leading-relaxed text-awc-ink-soft">
              {overview.summary.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="awc-card mt-8 p-6 sm:p-8">
              <DimensionBars items={bp.dimensions} />
            </div>
          </Section>

          <ProfileSection bp={bp} role="a" />
          <ProfileSection bp={bp} role="b" />

          <Section id="breakdown" title="Compatibility Breakdown" intro={<p>Every question, both answers. Where each of you sits on six everyday spectrums comes first — then all twenty answers, dimension by dimension.</p>}>
            <div className="awc-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="awc-serif text-xl">You, side by side</h3>
                <PeopleLegend names={names} />
              </div>
              <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {bp.axes.map((a) => (
                  <AxisSpectrum key={a.id} axis={a} names={names} />
                ))}
              </div>
            </div>
            <div className="mt-8 space-y-8">
              {bp.dimensions.map((d) => (
                <div key={d.id}>
                  <div className="flex items-baseline justify-between gap-4 border-b border-awc-line pb-3">
                    <h3 className="awc-serif text-2xl">{d.label}</h3>
                    <span className="awc-serif text-2xl tabular-nums text-awc-wine">{d.alignment}%</span>
                  </div>
                  <p className="mt-2 text-sm text-awc-muted">{d.headline}</p>
                  <div className="mt-4 space-y-3">
                    {d.rows.map((r) => (
                      <div key={r.questionId} className="rounded-2xl border border-awc-line bg-white p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[0.9375rem] font-semibold text-awc-ink">{r.topic}</p>
                          <RelationChip relation={r.relation} />
                        </div>
                        <p className="mt-1 text-[0.8125rem] text-awc-muted">{r.prompt}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {(['a', 'b'] as const).map((role) => (
                            <div key={role} className="flex items-start gap-2.5 text-[0.875rem] leading-snug text-awc-ink">
                              <PersonDot role={role} name={names[role]} size="sm" />
                              <span>{r[role]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="together" title="What Brings You Together" intro={<p>Where your answers match, sit close together, or fit like two halves.</p>}>
            <div className="space-y-4">
              {bp.together.length ? bp.together.map((i) => <SummaryItem key={i.id} insight={i} names={names} />) : <p className="text-awc-muted">Your answers differ on every topic — which makes the next section the place to start.</p>}
            </div>
          </Section>

          <Section id="differ" title="Where You Differ" intro={<p>Both perspectives, fairly. A difference isn’t a problem — it’s simply something it helps to know about each other.</p>}>
            <div className="space-y-4">
              {bp.differ.length ? bp.differ.map((i) => <SummaryItem key={i.id} insight={i} names={names} />) : <p className="text-awc-muted">You gave matching or neighbouring answers on every topic.</p>}
            </div>
          </Section>

          <DeepDiveSection dive={bp.emotional} names={names} />
          <DeepDiveSection dive={bp.communication} names={names} />
          <DeepDiveSection dive={bp.conflict} names={names} />
          <DeepDiveSection dive={bp.future} names={names} />

          <Section id="strengths" title="Relationship Strengths" intro={<p>What you can lean on — drawn from where your answers align or complement each other.</p>}>
            <div className="grid gap-4 sm:grid-cols-2">
              {bp.strengths.map((s) => (
                <article key={s.id} className="rounded-2xl border border-awc-line bg-white p-5">
                  <h3 className="awc-serif text-xl leading-tight">{s.title}</h3>
                  <div className="awc-prose mt-2 text-[0.9375rem] leading-relaxed text-awc-ink-soft">
                    {s.body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="blind-spots" title="Potential Blind Spots" intro={<p>Patterns that are easy to miss from the inside — including places where agreeing could hide a risk.</p>}>
            <div className="space-y-5">
              {bp.blindSpots.map((b) => (
                <InsightCard key={b.id} insight={b} names={names} />
              ))}
            </div>
          </Section>

          <Section id="starters" title="Conversation Starters" intro={<p>Chosen from your answers, most revealing first. Take one at a time — over dinner, on a walk, or before bed.</p>}>
            <ol className="space-y-3">
              {bp.starters.map((s, i) => (
                <li key={i} className="flex gap-4 rounded-2xl border border-awc-line bg-white p-5">
                  <span className="awc-numeral text-2xl">{i + 1}</span>
                  <div>
                    <p className="awc-serif text-[1.25rem] leading-snug text-awc-ink">{s.prompt}</p>
                    <p className="mt-2 text-[0.8125rem] leading-relaxed text-awc-muted">
                      <span className="font-semibold text-awc-ink-soft">{s.topic}.</span> {s.why}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="actions" title="Practical Action Plan" intro={<p>Small, specific steps — each one tied to something you actually said.</p>}>
            <div className="space-y-8">
              {horizons.map((h) => {
                const items = bp.actions.filter((a) => a.horizon === h);
                if (!items.length) return null;
                return (
                  <div key={h}>
                    <p className="awc-eyebrow">{h}</p>
                    <ul className="mt-3 space-y-3">
                      {items.map((a, i) => (
                        <li key={i} className="flex gap-4 rounded-2xl border border-awc-line bg-white p-5">
                          <span className="mt-1 h-5 w-5 shrink-0 rounded-md border-2 border-awc-wine/60" aria-hidden />
                          <div>
                            <p className="font-semibold text-awc-ink">{a.title}</p>
                            <p className="mt-1 leading-relaxed text-awc-ink-soft">{a.body}</p>
                            {a.because && <p className="mt-2 text-[0.8125rem] leading-relaxed text-awc-muted">{a.because}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>

          <footer className="rounded-2xl bg-awc-cream-2 p-6 text-[0.8125rem] leading-relaxed text-awc-muted">
            <p>{bp.disclaimer}</p>
            <p className="mt-3">
              Question set {bp.questionSetVersion} · Scoring {bp.scoringVersion} ·{' '}
              <Link href="/compatible/how-it-works#scoring" className="underline underline-offset-2">How scoring works</Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

