import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CompatFooter, CompatHeader } from '@/components/compat/Shell';
import { RelationChip } from '@/components/compat/Visuals';
import { RETENTION_DAYS } from '@/lib/compat/retention';
import type { Relation } from '@/lib/compat/types';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'How Are We Compatible? works: 20 questions, five dimensions, a transparent scoring method, and privacy by design.',
};

const RELATIONS: Array<[Relation, string, string]> = [
  ['shared', '100', 'You chose the same answer.'],
  ['close', '≈ 75–85', 'Neighbouring points on a spectrum — a difference of degree, not direction.'],
  ['complementary', '80', 'Different answers we’ve written up as fitting together, e.g. one of you raises things quickly while the other picks a calm moment.'],
  ['different', '45–60', 'A neutral difference in perspective. Questions about personal needs score higher, because wanting different things is information to act on, not a mismatch.'],
  ['tension', '15', 'Answers that are easy to misread — opposite ends of a spectrum, or pairs like “keep talking until it’s sorted” and “go quiet and withdraw”.'],
];

export default function HowItWorks() {
  return (
    <>
      <CompatHeader
        right={
          <Link href="/compatible/start" className="awc-btn awc-btn-primary min-h-0 px-4 py-2.5 text-sm">
            Start the test
          </Link>
        }
      />
      <main id="main" className="flex-1">
        <article className="awc-container max-w-3xl py-12 md:py-20">
          <p className="awc-eyebrow">How it works</p>
          <h1 className="awc-serif mt-4 text-5xl leading-[1.05] md:text-6xl">Honest questions, transparent answers</h1>
          <p className="mt-6 text-lg leading-relaxed text-awc-ink-soft">
            Are We Compatible? asks two people the same 20 questions, separately, then compares every pair of answers. There’s no hidden algorithm and no guesswork: every result traces back to something you each said.
          </p>

          <section className="mt-16">
            <h2 className="awc-serif text-3xl">The questions</h2>
            <p className="mt-4 leading-relaxed text-awc-ink-soft">
              Twenty original questions — four in each of five dimensions: Communication, Emotional Connection, Lifestyle & Personal Space, Future Expectations, and Conflict & Understanding. Each has three to five answers describing real habits and preferences, rather than abstract personality traits. They were written for this product and aren’t taken from any psychological test.
            </p>
          </section>

          <section id="scoring" className="mt-16 scroll-mt-24">
            <h2 className="awc-serif text-3xl">How we score</h2>
            <p className="mt-4 leading-relaxed text-awc-ink-soft">
              Scoring is deterministic: the same answers always produce the same result. For each question, we look at how your two answers meet and give that pair an <strong>alignment</strong> value from 0 to 100:
            </p>
            <div className="mt-6 divide-y divide-awc-line overflow-hidden rounded-2xl border border-awc-line bg-white">
              {RELATIONS.map(([r, v, d]) => (
                <div key={r} className="grid gap-2 p-4 sm:grid-cols-[11rem_4.5rem_1fr] sm:items-baseline sm:gap-4 sm:p-5">
                  <span><RelationChip relation={r} /></span>
                  <span className="awc-serif text-lg tabular-nums">{v}</span>
                  <span className="text-[0.9375rem] leading-relaxed text-awc-ink-soft">{d}</span>
                </div>
              ))}
            </div>
            <ul className="mt-6 space-y-3 leading-relaxed text-awc-ink-soft">
              <li><strong className="text-awc-ink">Shared blind spots.</strong> Agreeing isn’t automatically ideal. If you both, say, go quiet in an argument, that pair scores 70 rather than 100 and is flagged as a blind spot.</li>
              <li><strong className="text-awc-ink">Dimension scores</strong> are the weighted average of the four questions in each dimension. A few weightier topics — children, pace of commitment, money, how love is received, behaviour in disagreements — count slightly more.</li>
              <li><strong className="text-awc-ink">Overall alignment</strong> is the average of the five dimension scores.</li>
              <li><strong className="text-awc-ink">Similarity</strong> is reported separately: purely how alike your answers are, along with how many you answered identically.</li>
              <li><strong className="text-awc-ink">Profiles</strong> place each of you on six everyday spectrums (expressing feelings, closeness and space, handling issues, plans and spontaneity, reassurance, looking ahead), based on your own answers only. They don’t affect your scores.</li>
            </ul>
            <p className="mt-6 leading-relaxed text-awc-ink-soft">
              Every insight in your results and Blueprint is assembled from text written for the specific answers you chose, and shows those answers as evidence. Each assessment records the question-set and scoring versions it was taken with, so results never change after the fact.
            </p>
            <p className="mt-6 rounded-2xl bg-awc-cream-2 p-5 text-[0.9375rem] leading-relaxed text-awc-ink-soft">
              <strong className="text-awc-ink">An honest caveat:</strong> this is for reflection and entertainment. It isn’t a validated psychological assessment or a diagnosis, and no questionnaire can predict whether a relationship will succeed. Use it to start conversations, not to settle them.
            </p>
          </section>

          <section id="privacy" className="mt-16 scroll-mt-24">
            <h2 className="awc-serif text-3xl">Privacy</h2>
            <ul className="mt-5 space-y-4 leading-relaxed text-awc-ink-soft">
              <li><strong className="text-awc-ink">No accounts.</strong> We ask only for a first name. Each of you gets a private link — that link is the only key to your results, and we store it only in a scrambled (hashed) form.</li>
              <li><strong className="text-awc-ink">Answers stay hidden.</strong> Neither of you can see the other’s answers until both have submitted. Answers lock on submission.</li>
              <li><strong className="text-awc-ink">One payment, both of you.</strong> Unlocking the Blueprint makes it available to both participants. Payments are handled by our payment provider; we never see card details.</li>
              <li><strong className="text-awc-ink">Delete anytime.</strong> Either participant can permanently delete the assessment — both sets of answers and the report — from their results page.</li>
              <li><strong className="text-awc-ink">Automatic clean-up.</strong> Unfinished tests are deleted after {RETENTION_DAYS.open} days, and completed results about {Math.round(RETENTION_DAYS.complete / 30)} months after you both finish.</li>
              <li><strong className="text-awc-ink">Anonymous analytics.</strong> We count page views and steps like “started” or “finished” to improve the experience — never names, answers or private links.</li>
            </ul>
          </section>

          <div className="mt-16 rounded-[1.75rem] bg-awc-blush-soft p-8 text-center">
            <h2 className="awc-serif text-3xl">Ready when you are</h2>
            <Link href="/compatible/start" className="awc-btn awc-btn-primary mt-6 px-8">
              Start the test <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </article>
      </main>
      <CompatFooter />
    </>
  );
}
