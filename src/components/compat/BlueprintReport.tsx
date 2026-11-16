import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Heart, HeartHandshake } from 'lucide-react';
import type { Locale } from '@/lib/compat/i18n';
import { horizonLabels, type Blueprint, type DeepDive, type Insight } from '@/lib/compat/report';
import type { Horizon } from '@/lib/compat/report-strings';
import { SECTION_IDS, sectionTitles, type SectionId } from '@/lib/compat/sections';
import { UI } from '@/lib/compat/ui-strings';
import { PdfLink, TrackView } from './Actions';
import { Venn } from './Brand';
import { AxisSpectrum, DimensionBars, InsightCard, PeopleLegend, PersonDot, RelationChip, ScoreRing } from './Visuals';

const num = (id: string) => String(SECTION_IDS.indexOf(id as SectionId) + 1).padStart(2, '0');

/** Where a single-question insight is covered in depth (null: only in the overview sections). */
function deepDiveFor(i: Insight): SectionId | null {
  if (i.id === 'life-recharge') return 'emotional';
  const deep: string[] = ['emotional', 'communication', 'conflict', 'future'];
  return i.dimension && deep.includes(i.dimension) ? (i.dimension as SectionId) : null;
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
function SummaryItem({ insight, names, locale, titles }: { insight: Insight; names: Blueprint['names']; locale: Locale; titles: Record<SectionId, string> }) {
  const deep = deepDiveFor(insight);
  if (!deep) return <InsightCard insight={insight} names={names} locale={locale} />;
  return (
    <article className="rounded-2xl border border-awc-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="awc-serif text-xl leading-tight">{insight.title}</h3>
        {insight.relation && <span className="sm:ml-auto"><RelationChip relation={insight.relation} locale={locale} /></span>}
      </div>
      <p className="mt-2.5 text-[0.98rem] leading-relaxed text-awc-ink-soft">{insight.body[0]}</p>
      <a href={`#${deep}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-awc-wine hover:text-awc-wine-dark">
        {UI[locale].blueprint.more(num(deep), titles[deep])} <ArrowRight size={14} aria-hidden />
      </a>
    </article>
  );
}

function DeepDiveSection({ dive, names, locale }: { dive: DeepDive; names: Blueprint['names']; locale: Locale }) {
  return (
    <Section id={dive.id} title={dive.title} intro={dive.intro.map((p, i) => <p key={i}>{p}</p>)}>
      <div className="space-y-5">
        {dive.items.map((i) => (
          <InsightCard key={i.id} insight={i} names={names} locale={locale} />
        ))}
      </div>
    </Section>
  );
}

function ProfileSection({ bp, role, locale }: { bp: Blueprint; role: 'a' | 'b'; locale: Locale }) {
  const p = bp.profiles[role];
  const t = UI[locale].blueprint;
  return (
    <Section id={`profile-${role}`} title={t.profileTitle(p.name)}>
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
              <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted"><Heart size={13} aria-hidden /> {t.lovedThrough}</p>
              <p className="mt-1.5 text-[0.9375rem] font-semibold text-awc-ink">{p.care.loved}</p>
            </div>
            <div className="rounded-2xl bg-awc-cream p-4">
              <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted"><HeartHandshake size={13} aria-hidden /> {t.showsThrough}</p>
              <p className="mt-1.5 text-[0.9375rem] font-semibold text-awc-ink">{p.care.shows}</p>
            </div>
          </div>
          <p className="mt-7 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted">{t.ownAnswers(p.name)}</p>
          <ul className="mt-3 divide-y divide-awc-line">
            {p.traits.map((trait) => (
              <li key={trait} className="flex gap-3 py-2.5 text-[0.9688rem] leading-relaxed text-awc-ink-soft">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: role === 'a' ? 'var(--color-awc-wine)' : 'var(--color-awc-slate)' }} />
                {trait}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function BlueprintReport({ bp, token, generated, locale }: { bp: Blueprint; token: string; generated: string; locale: Locale }) {
  const { names, overview } = bp;
  const t = UI[locale].blueprint;
  const titles = sectionTitles(bp, locale);
  const horizons: Horizon[] = ['week', 'month', 'ongoing'];
  const horizonLabel = horizonLabels(locale);
  const navLabel = (id: SectionId) => (id === 'profile-a' ? t.profileNav(names.a) : id === 'profile-b' ? t.profileNav(names.b) : titles[id]);
  return (
    <div>
      <TrackView event="compat_blueprint_view" props={{ locale }} />
      {/* Cover */}
      <header className="relative overflow-hidden bg-awc-wine-deep text-white">
        <svg aria-hidden viewBox="0 0 600 400" className="pointer-events-none absolute -bottom-40 -left-40 w-[640px] opacity-[0.05]">
          <circle cx="230" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="370" cy="200" r="170" fill="none" stroke="#fff" strokeWidth="2" />
        </svg>
        <div className="awc-container relative grid items-center gap-8 py-12 md:py-20 lg:grid-cols-[1fr_auto]">
          <div>
          <Link href={`/compatible/s/${token}`} className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft size={15} aria-hidden /> {t.back}
          </Link>
          <p className="awc-eyebrow mt-8 !text-awc-blush">{t.eyebrow}</p>
          <h1 className="awc-serif mt-4 text-[2.9rem] leading-[1.02] sm:text-7xl">
            {names.a} <em className="text-awc-blush">&</em> {names.b}
          </h1>
          <p className="awc-serif mt-5 text-2xl italic text-white/85 sm:text-3xl">{overview.signature.title}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/65">
            <span>{bp.context.label}</span>
            <span>{generated}</span>
            <span>{t.aligned(overview.alignment)}</span>
          </div>
          </div>
          <div className="hidden justify-center sm:flex lg:justify-end">
            <Venn names={names} overlap={overview.similarity} size={320} tone="dark" label={UI[locale].blueprint.overviewStats({ same: overview.sameAnswers, total: overview.total, similarity: overview.similarity, complementary: overview.counts.complementary, tension: overview.counts.tension })} />
          </div>
        </div>
      </header>

      {/* Mobile section nav */}
      <nav aria-label={t.navAria} className="sticky top-14 z-30 border-b border-awc-line bg-awc-cream/95 backdrop-blur lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
          {SECTION_IDS.map((id) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-awc-line bg-white px-3 py-1.5 text-xs font-semibold text-awc-ink-soft">
              {num(id)} {id === 'profile-a' ? names.a : id === 'profile-b' ? names.b : titles[id]}
            </a>
          ))}
        </div>
      </nav>

      <div className="awc-container grid gap-10 py-10 lg:grid-cols-[15rem_1fr] lg:gap-14 lg:py-16">
        <aside className="hidden lg:block">
          <nav aria-label={t.navAria} className="sticky top-24">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-awc-muted">{t.contents}</p>
            <ol className="mt-4 space-y-1">
              {SECTION_IDS.map((id) => (
                <li key={id}>
                  <a href={`#${id}`} className="flex gap-3 rounded-lg px-2 py-1.5 text-sm text-awc-ink-soft hover:bg-white hover:text-awc-wine-dark">
                    <span className="awc-numeral w-5 text-sm">{num(id)}</span>
                    {navLabel(id)}
                  </a>
                </li>
              ))}
            </ol>
            <div className="mt-6 px-2">
              <PdfLink href={`/api/compat/p/${token}/blueprint`} label={t.pdf} />
            </div>
          </nav>
        </aside>

        <div className="min-w-0 max-w-3xl space-y-16">
          <div className="flex flex-wrap items-center justify-between gap-4 lg:hidden">
            <PeopleLegend names={names} />
            <PdfLink href={`/api/compat/p/${token}/blueprint`} label={t.pdf} />
          </div>

          <Section id="overview" title={titles.overview} kicker={overview.signature.tagline}>
            <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
              <div className="flex justify-center">
                <ScoreRing value={overview.alignment} size={180} label={UI[locale].landing.preview.aligned} />
              </div>
              <div>
                <p className="awc-serif text-2xl leading-snug">{overview.signature.description}</p>
                <p className="mt-4 text-sm text-awc-muted">
                  {t.overviewStats({ same: overview.sameAnswers, total: overview.total, similarity: overview.similarity, complementary: overview.counts.complementary, tension: overview.counts.tension })}
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

          <ProfileSection bp={bp} role="a" locale={locale} />
          <ProfileSection bp={bp} role="b" locale={locale} />

          <Section id="breakdown" title={titles.breakdown} intro={<p>{t.breakdownIntro}</p>}>
            <div className="awc-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="awc-serif text-xl">{t.sideBySide}</h3>
                <PeopleLegend names={names} />
              </div>
              <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {bp.axes.map((a) => (
                  <AxisSpectrum key={a.id} axis={a} names={names} locale={locale} />
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
                          <RelationChip relation={r.relation} locale={locale} />
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

          <Section id="together" title={titles.together} intro={<p>{t.togetherIntro}</p>}>
            <div className="space-y-4">
              {bp.together.length ? bp.together.map((i) => <SummaryItem key={i.id} insight={i} names={names} locale={locale} titles={titles} />) : <p className="text-awc-muted">{t.togetherEmpty}</p>}
            </div>
          </Section>

          <Section id="differ" title={titles.differ} intro={<p>{t.differIntro}</p>}>
            <div className="space-y-4">
              {bp.differ.length ? bp.differ.map((i) => <SummaryItem key={i.id} insight={i} names={names} locale={locale} titles={titles} />) : <p className="text-awc-muted">{t.differEmpty}</p>}
            </div>
          </Section>

          <DeepDiveSection dive={bp.emotional} names={names} locale={locale} />
          <DeepDiveSection dive={bp.communication} names={names} locale={locale} />
          <DeepDiveSection dive={bp.conflict} names={names} locale={locale} />
          <DeepDiveSection dive={bp.future} names={names} locale={locale} />

          <Section id="strengths" title={titles.strengths} intro={<p>{t.strengthsIntro}</p>}>
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

          <Section id="blind-spots" title={titles['blind-spots']} intro={<p>{t.blindIntro}</p>}>
            <div className="space-y-5">
              {bp.blindSpots.map((b) => (
                <InsightCard key={b.id} insight={b} names={names} locale={locale} />
              ))}
            </div>
          </Section>

          <Section id="starters" title={titles.starters} intro={<p>{t.startersIntro}</p>}>
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

          <Section id="actions" title={titles.actions} intro={<p>{t.actionsIntro}</p>}>
            <div className="space-y-8">
              {horizons.map((h) => {
                const items = bp.actions.filter((a) => a.horizon === h);
                if (!items.length) return null;
                return (
                  <div key={h}>
                    <p className="awc-eyebrow">{horizonLabel[h]}</p>
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
              {t.versions(bp.questionSetVersion, bp.scoringVersion)} ·{' '}
              <Link href="/compatible/how-it-works#scoring" className="underline underline-offset-2">{t.howScoring}</Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

