import Link from 'next/link';
import { ArrowRight, Check, Clock, FileText, Lock, Sparkles } from 'lucide-react';
import type { BlueprintPreview } from '@/lib/compat/report';
import type { ParticipantView } from '@/lib/compat/server/view';
import { DeleteData, InviteCard, PrivateLink, ShareResult, StatusPoller, TrackView, UnlockButton } from './Actions';
import { FlowScreen } from './Shell';
import { DimensionBars, InsightCard, PeopleLegend, PersonDot, ScoreRing } from './Visuals';

const snapshot = (v: ParticipantView) => `${v.stage}:${v.partnerJoined}:${v.partnerSubmitted}:${v.unlocked}`;

export function WaitingStage({ view, privateUrl }: { view: ParticipantView; privateUrl: string }) {
  const partner = view.partnerName;
  return (
    <div className="awc-anim-in">
      <StatusPoller token={view.token} snapshot={snapshot(view)} />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-awc-wine text-white">
        <Check size={24} strokeWidth={2.5} className="awc-anim-pop" aria-hidden />
      </div>
      <p className="awc-eyebrow mt-6">Your answers are in, {view.name}</p>
      {!view.partnerJoined ? (
        <>
          <h1 className="awc-serif mt-3 text-[2.2rem] leading-[1.1] sm:text-5xl">
            Now it’s <em className="text-awc-wine">their</em> turn.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-awc-ink-soft">Send your invitation to the person you’re taking this with. Your results unlock for both of you the moment they finish.</p>
        </>
      ) : (
        <>
          <h1 className="awc-serif mt-3 text-[2.2rem] leading-[1.1] sm:text-5xl">
            Waiting for <em className="text-awc-wine">{partner}</em>.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-awc-ink-soft">They’ve opened your invitation. This page updates by itself when they finish — or come back to your private link any time.</p>
        </>
      )}

      <div className="mt-8 space-y-5">
        {view.inviteUrl && !view.partnerJoined && <InviteCard inviteUrl={view.inviteUrl} name={view.name} />}
        <div className="awc-card divide-y divide-awc-line">
          <StatusRow done label={view.name} detail="Finished" role={view.role} name={view.name} />
          <StatusRow
            done={view.partnerSubmitted}
            label={partner ?? 'The other person'}
            detail={!view.partnerJoined ? 'Hasn’t opened the invitation yet' : view.partnerSubmitted ? 'Finished' : 'Answering now…'}
            pending={view.partnerJoined && !view.partnerSubmitted}
            role={view.role === 'a' ? 'b' : 'a'}
            name={partner ?? '?'}
          />
        </div>
        <PrivateLink url={privateUrl} />
      </div>
      <div className="mt-10">
        <DeleteData token={view.token} partnerName={partner} />
      </div>
    </div>
  );
}

function StatusRow({ done, label, detail, pending, role, name }: { done: boolean; label: string; detail: string; pending?: boolean; role: 'a' | 'b'; name: string }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-4">
      <PersonDot role={role} name={name} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-awc-ink">{label}</p>
        <p className={`text-sm ${pending ? 'awc-pulse text-awc-wine' : 'text-awc-muted'}`}>{detail}</p>
      </div>
      {done ? <Check size={20} className="text-awc-sage" aria-label="Done" /> : <Clock size={18} className="text-awc-muted" aria-label="Waiting" />}
    </div>
  );
}

export function ResultsStage({ view, preview, price, privateUrl, siteUrl, notice }: { view: ParticipantView; preview: BlueprintPreview; price: string; privateUrl: string; siteUrl: string; notice?: string }) {
  const { names, overview } = preview;
  const sig = overview.signature;
  const shareText = `${names.a} & ${names.b}: we’re “${sig.title}” — ${overview.alignment}% aligned on Are We Compatible? Find out yours:`;
  return (
    <div>
      <TrackView event="compat_results_view" props={{ unlocked: view.unlocked }} />
      {/* Headline */}
      <section className="awc-anim-in text-center">
        <p className="awc-eyebrow">
          {names.a} & {names.b} · {preview.context.label}
        </p>
        <h1 className="awc-serif mx-auto mt-4 max-w-2xl text-[2.6rem] leading-[1.05] sm:text-6xl">{sig.title}</h1>
        <p className="awc-serif mx-auto mt-3 max-w-xl text-xl italic text-awc-wine">{sig.tagline}</p>
        <div className="mt-9 flex justify-center">
          <ScoreRing value={overview.alignment} />
        </div>
        <p className="mx-auto mt-6 max-w-md text-[0.9375rem] leading-relaxed text-awc-ink-soft">
          Same answer on <strong className="text-awc-ink">{overview.sameAnswers} of {overview.total}</strong> questions · <strong className="text-awc-ink">{overview.similarity}%</strong> similarity
        </p>
        <p className="mx-auto mt-2 max-w-md text-[0.8125rem] leading-relaxed text-awc-muted">
          Similarity is how alike your answers are. Alignment is how well they fit together — so complementary differences count in your favour.{' '}
          <Link href="/compatible/how-it-works#scoring" className="underline underline-offset-2 hover:text-awc-wine">How we score</Link>
        </p>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-awc-ink-soft">{sig.description}</p>
      </section>

      <section className="awc-card mx-auto mt-12 max-w-2xl p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="awc-serif text-2xl">Your five dimensions</h2>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-awc-muted">Alignment</span>
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
            <p className="awc-eyebrow mb-3">What brings you together</p>
            <InsightCard insight={preview.together} names={names} showTip={false} />
          </div>
        )}
        {preview.differ && (
          <div>
            <p className="awc-eyebrow mb-3">Where you differ</p>
            <InsightCard insight={preview.differ} names={names} showTip={false} />
          </div>
        )}
      </section>

      {view.unlocked ? (
        <section className="mx-auto mt-14 max-w-2xl rounded-[1.75rem] bg-awc-wine-deep p-7 text-center text-white sm:p-10">
          <FileText size={28} className="mx-auto text-awc-blush" aria-hidden />
          <h2 className="awc-serif mt-4 text-3xl sm:text-4xl">Your Relationship Blueprint is ready</h2>
          <p className="mx-auto mt-3 max-w-md text-white/75">Unlocked for both of you — all fourteen sections, plus a PDF to keep.</p>
          <Link href={`/compatible/s/${view.token}/blueprint`} className="awc-btn awc-btn-light mt-7 px-8 text-base">
            Open the Blueprint <ArrowRight size={18} aria-hidden />
          </Link>
        </section>
      ) : (
        <>
          {notice && (
            <p className="mx-auto mt-14 max-w-2xl rounded-2xl bg-awc-amber-soft px-5 py-4 text-[0.9375rem] text-awc-amber" role="status">
              {notice}
            </p>
          )}
          <BlueprintOffer token={view.token} preview={preview} price={price} />
        </>
      )}

      <section className="mx-auto mt-14 max-w-2xl">
        <h2 className="awc-serif text-2xl">Share your result</h2>
        <p className="mt-2 text-[0.9375rem] text-awc-muted">Shares your headline only — never your answers.</p>
        <div className="mt-4 rounded-2xl border border-awc-line bg-white p-4 text-[0.9375rem] italic text-awc-ink-soft">“{shareText} {siteUrl}”</div>
        <div className="mt-3">
          <ShareResult text={shareText} url={siteUrl} />
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-2xl space-y-8">
        <PrivateLink url={privateUrl} />
        <DeleteData token={view.token} partnerName={view.partnerName} />
      </section>
    </div>
  );
}

function BlueprintOffer({ token, preview, price }: { token: string; preview: BlueprintPreview; price: string }) {
  const { names, counts } = preview;
  const locked = ['Individual profiles for both of you', 'Every answer, compared side by side', 'Emotional needs & how you each give care', 'Communication and conflict dynamics', 'Future expectations', 'Strengths & potential blind spots', 'Personalised conversation starters', 'A practical action plan', 'Downloadable PDF'];
  return (
    <section className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-[1.75rem] border border-awc-line bg-white shadow-[var(--shadow-awc-lift)]">
      <div className="bg-awc-wine-deep px-6 pb-8 pt-9 text-white sm:px-10">
        <p className="awc-eyebrow !text-awc-blush">
          <Sparkles size={13} className="mr-1.5 inline -translate-y-px" aria-hidden />
          The full story
        </p>
        <h2 className="awc-serif mt-3 text-[2rem] leading-tight sm:text-4xl">The Relationship Blueprint</h2>
        <p className="mt-3 max-w-lg leading-relaxed text-white/75">
          A personalised analysis written from both of your answers. We found{' '}
          <strong className="text-white">{counts.differences} {counts.differences === 1 ? 'difference' : 'differences'} worth understanding</strong>
          {counts.blindSpots ? (
            <>
              , <strong className="text-white">{counts.blindSpots} potential blind {counts.blindSpots === 1 ? 'spot' : 'spots'}</strong>
            </>
          ) : null}{' '}
          and <strong className="text-white">{counts.strengths} strengths</strong> — plus {counts.starters} conversation starters and a {counts.actions}-step action plan for {names.a} and {names.b}.
        </p>
      </div>
      <div className="px-6 py-7 sm:px-10">
        <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {locked.map((x) => (
            <li key={x} className="flex items-start gap-2.5 text-[0.9375rem] text-awc-ink-soft">
              <Lock size={14} className="mt-1 shrink-0 text-awc-wine" aria-hidden />
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-4 border-t border-awc-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="awc-serif text-3xl">{price}</p>
            <p className="text-sm text-awc-muted">One payment · unlocks it for both of you</p>
          </div>
          <UnlockButton token={token} label="Unlock the Blueprint" />
        </div>
        <p className="mt-4 text-[0.75rem] leading-relaxed text-awc-muted">One-time purchase, no subscription. For reflection and entertainment — not a psychological diagnosis.</p>
      </div>
    </section>
  );
}

export function InvalidLink() {
  return (
    <FlowScreen>
      <div className="flex flex-1 flex-col justify-center text-center">
        <p className="awc-eyebrow">Private link</p>
        <h1 className="awc-serif mt-3 text-4xl">This link isn’t valid any more</h1>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-awc-ink-soft">It may have been mistyped, or the results were deleted. Results are also removed automatically after a while to protect your privacy.</p>
        <Link href="/compatible/start" className="awc-btn awc-btn-primary mx-auto mt-8">
          Start a new test
        </Link>
      </div>
    </FlowScreen>
  );
}

