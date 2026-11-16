import Link from 'next/link';
import { ArrowRight, Check, Clock, FileText, Lock, Sparkles } from 'lucide-react';
import type { Locale } from '@/lib/compat/i18n';
import type { BlueprintPreview } from '@/lib/compat/report';
import type { ParticipantView } from '@/lib/compat/server/view';
import { UI } from '@/lib/compat/ui-strings';
import { DeleteData, InviteCard, PrivateLink, ShareResult, StatusPoller, TrackView, UnlockButton } from './Actions';
import { FlowScreen } from './Shell';
import { DimensionBars, InsightCard, PeopleLegend, PersonDot, ScoreRing } from './Visuals';

const snapshot = (v: ParticipantView) => `${v.stage}:${v.partnerJoined}:${v.partnerSubmitted}:${v.unlocked}`;

export function WaitingStage({ view, privateUrl, locale }: { view: ParticipantView; privateUrl: string; locale: Locale }) {
  const t = UI[locale].waiting;
  const partner = view.partnerName;
  return (
    <div className="awc-anim-in">
      <StatusPoller token={view.token} snapshot={snapshot(view)} />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-awc-wine text-white">
        <Check size={24} strokeWidth={2.5} className="awc-anim-pop" aria-hidden />
      </div>
      <p className="awc-eyebrow mt-6">{t.eyebrow(view.name)}</p>
      {!view.partnerJoined ? (
        <>
          <h1 className="awc-serif mt-3 text-[2.2rem] leading-[1.1] sm:text-5xl">
            {t.turnA} <em className="text-awc-wine">{t.turnEm}</em>
            {t.turnB === '.' ? '.' : ` ${t.turnB}`}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-awc-ink-soft">{t.turnLead}</p>
        </>
      ) : (
        <>
          <h1 className="awc-serif mt-3 text-[2.2rem] leading-[1.1] sm:text-5xl">
            {t.waitingFor} <em className="text-awc-wine">{partner}</em>.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-awc-ink-soft">{t.waitingLead}</p>
        </>
      )}

      <div className="mt-8 space-y-5">
        {view.inviteUrl && !view.partnerJoined && <InviteCard inviteUrl={view.inviteUrl} name={view.name} locale={locale} />}
        <div className="awc-card divide-y divide-awc-line">
          <StatusRow done label={view.name} detail={t.finished} role={view.role} name={view.name} locale={locale} />
          <StatusRow
            done={view.partnerSubmitted}
            label={partner ?? t.otherPerson}
            detail={!view.partnerJoined ? t.notOpened : view.partnerSubmitted ? t.finished : t.answering}
            pending={view.partnerJoined && !view.partnerSubmitted}
            role={view.role === 'a' ? 'b' : 'a'}
            name={partner ?? '?'}
            locale={locale}
          />
        </div>
        <PrivateLink url={privateUrl} locale={locale} />
      </div>
      <div className="mt-10">
        <DeleteData token={view.token} partnerName={partner} locale={locale} />
      </div>
    </div>
  );
}

function StatusRow({ done, label, detail, pending, role, name, locale }: { done: boolean; label: string; detail: string; pending?: boolean; role: 'a' | 'b'; name: string; locale: Locale }) {
  const t = UI[locale].waiting;
  return (
    <div className="flex items-center gap-3.5 px-5 py-4">
      <PersonDot role={role} name={name} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-awc-ink">{label}</p>
        <p className={`text-sm ${pending ? 'awc-pulse text-awc-wine' : 'text-awc-muted'}`}>{detail}</p>
      </div>
      {done ? <Check size={20} className="text-awc-sage" aria-label={t.done} /> : <Clock size={18} className="text-awc-muted" aria-label={t.pending} />}
    </div>
  );
}

export function ResultsStage({ view, preview, price, privateUrl, siteUrl, notice, locale }: { view: ParticipantView; preview: BlueprintPreview; price: string; privateUrl: string; siteUrl: string; notice?: string; locale: Locale }) {
  const t = UI[locale].results;
  const { names, overview } = preview;
  const sig = overview.signature;
  const shareText = t.shareText(names.a, names.b, sig.title, overview.alignment);
  const [s1, s2, s3] = t.sameOf(overview.sameAnswers, overview.total);
  return (
    <div>
      <TrackView event="compat_results_view" props={{ unlocked: view.unlocked, locale }} />
      {/* Headline */}
      <section className="awc-anim-in text-center">
        <p className="awc-eyebrow">
          {names.a} & {names.b} · {preview.context.label}
        </p>
        <h1 className="awc-serif mx-auto mt-4 max-w-2xl text-[2.6rem] leading-[1.05] sm:text-6xl">{sig.title}</h1>
        <p className="awc-serif mx-auto mt-3 max-w-xl text-xl italic text-awc-wine">{sig.tagline}</p>
        <div className="mt-9 flex justify-center">
          <ScoreRing value={overview.alignment} label={UI[locale].landing.preview.aligned} />
        </div>
        <p className="mx-auto mt-6 max-w-md text-[0.9375rem] leading-relaxed text-awc-ink-soft">
          {s1}
          <strong className="text-awc-ink">{s2}</strong>
          {s3}
          <strong className="text-awc-ink">{overview.similarity}%</strong> {t.similarity}
        </p>
        <p className="mx-auto mt-2 max-w-md text-[0.8125rem] leading-relaxed text-awc-muted">
          {t.explain}{' '}
          <Link href="/compatible/how-it-works#scoring" className="underline underline-offset-2 hover:text-awc-wine">
            {t.howWeScore}
          </Link>
        </p>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-awc-ink-soft">{sig.description}</p>
      </section>

      <section className="awc-card mx-auto mt-12 max-w-2xl p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="awc-serif text-2xl">{t.dimsTitle}</h2>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted">{t.alignment}</span>
        </div>
        <div className="mt-6">
          <DimensionBars items={preview.dimensions} />
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-2xl space-y-8">
        <div className="flex justify-center">
          <PeopleLegend names={names} />
        </div>
        {preview.together && (
          <div>
            <p className="awc-eyebrow mb-3">{t.together}</p>
            <InsightCard insight={preview.together} names={names} showTip={false} locale={locale} />
          </div>
        )}
        {preview.differ && (
          <div>
            <p className="awc-eyebrow mb-3">{t.differ}</p>
            <InsightCard insight={preview.differ} names={names} showTip={false} locale={locale} />
          </div>
        )}
      </section>

      {view.unlocked ? (
        <section className="mx-auto mt-14 max-w-2xl rounded-[1.75rem] bg-awc-wine-deep p-7 text-center text-white sm:p-10">
          <FileText size={28} className="mx-auto text-awc-blush" aria-hidden />
          <h2 className="awc-serif mt-4 text-3xl sm:text-4xl">{t.readyTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-white/75">{t.readyLead}</p>
          <Link href={`/compatible/s/${view.token}/blueprint`} className="awc-btn awc-btn-light mt-7 px-8 text-base">
            {t.open} <ArrowRight size={18} aria-hidden />
          </Link>
        </section>
      ) : (
        <>
          {notice && (
            <p className="mx-auto mt-14 max-w-2xl rounded-2xl bg-awc-amber-soft px-5 py-4 text-[0.9375rem] text-awc-amber" role="status">
              {notice}
            </p>
          )}
          <BlueprintOffer token={view.token} preview={preview} price={price} locale={locale} />
        </>
      )}

      <section className="mx-auto mt-14 max-w-2xl">
        <h2 className="awc-serif text-2xl">{t.shareTitle}</h2>
        <p className="mt-2 text-[0.9375rem] text-awc-muted">{t.shareLead}</p>
        <div className="mt-4 rounded-2xl border border-awc-line bg-white p-4 text-[0.9375rem] italic text-awc-ink-soft">“{shareText} {siteUrl}”</div>
        <div className="mt-3">
          <ShareResult text={shareText} url={siteUrl} locale={locale} />
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-2xl space-y-8">
        <PrivateLink url={privateUrl} locale={locale} />
        <DeleteData token={view.token} partnerName={view.partnerName} locale={locale} />
      </section>
    </div>
  );
}

function BlueprintOffer({ token, preview, price, locale }: { token: string; preview: BlueprintPreview; price: string; locale: Locale }) {
  const t = UI[locale].offer;
  const { names, counts } = preview;
  const [l0, l1, l2, l3, l4, l5, l6] = t.lead({ ...counts, a: names.a, b: names.b });
  return (
    <section className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-[1.75rem] border border-awc-line bg-white shadow-[var(--shadow-awc-lift)]">
      <div className="bg-awc-wine-deep px-6 pb-8 pt-9 text-white sm:px-10">
        <p className="awc-eyebrow !text-awc-blush">
          <Sparkles size={13} className="mr-1.5 inline -translate-y-px" aria-hidden />
          {t.eyebrow}
        </p>
        <h2 className="awc-serif mt-3 text-[2rem] leading-tight sm:text-4xl">{t.title}</h2>
        <p className="mt-3 max-w-lg leading-relaxed text-white/75">
          {l0}
          <strong className="text-white">{l1}</strong>
          {l2}
          {l3 && <strong className="text-white">{l3}</strong>}
          {l4}
          <strong className="text-white">{l5}</strong>
          {l6}
        </p>
      </div>
      <div className="px-6 py-7 sm:px-10">
        <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {t.locked.map((x) => (
            <li key={x} className="flex items-start gap-2.5 text-[0.9375rem] text-awc-ink-soft">
              <Lock size={14} className="mt-1 shrink-0 text-awc-wine" aria-hidden />
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-4 border-t border-awc-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="awc-serif text-3xl">{price}</p>
            <p className="text-sm text-awc-muted">{t.once}</p>
          </div>
          <UnlockButton token={token} label={t.unlock} locale={locale} />
        </div>
        <p className="mt-4 text-[0.75rem] leading-relaxed text-awc-muted">{t.fine}</p>
      </div>
    </section>
  );
}

export function InvalidLink({ locale }: { locale: Locale }) {
  const t = UI[locale].invalid;
  return (
    <FlowScreen>
      <div className="flex flex-1 flex-col justify-center text-center">
        <p className="awc-eyebrow">{t.eyebrow}</p>
        <h1 className="awc-serif mt-3 text-4xl">{t.title}</h1>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-awc-ink-soft">{t.body}</p>
        <Link href="/compatible/start" className="awc-btn awc-btn-primary mx-auto mt-8">
          {t.cta}
        </Link>
      </div>
    </FlowScreen>
  );
}
