import type { Metadata } from 'next';
import { connection } from 'next/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { JoinFlow } from '@/components/compat/JoinFlow';
import { CompatHeader, FlowScreen } from '@/components/compat/Shell';
import { InvalidLink } from '@/components/compat/Stages';
import { findByInvite, findByToken } from '@/lib/compat/server/repo';
import { rememberedTokens } from '@/lib/compat/server/view';

export const metadata: Metadata = {
  title: 'You’re invited',
  description: 'Two people. Same questions. Different perspectives. Answer privately, then see your results together.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

async function Invite({ params }: { params: Promise<{ invite: string }> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { invite } = await params;
  const found = await findByInvite(invite);
  if (!found) return <InvalidLink />;

  // Opened in a browser that already holds a seat in this assessment?
  for (const t of await rememberedTokens()) {
    const mine = await findByToken(t);
    if (mine?.assessment.id !== found.assessment.id) continue;
    const own = mine.me.role === 'a';
    return (
      <FlowScreen>
        <div className="flex flex-1 flex-col justify-center">
          <p className="awc-eyebrow">{own ? 'This is your invitation' : 'Welcome back'}</p>
          <h1 className="awc-serif mt-3 text-4xl leading-tight">{own ? 'Send this link to the other person' : `You’ve already joined, ${mine.me.name}`}</h1>
          <p className="mt-4 leading-relaxed text-awc-ink-soft">
            {own ? 'This invitation is meant for the person you’re taking the test with. Opening it yourself won’t do anything — share it with them instead.' : 'Your answers are saved to your own private link.'}
          </p>
          <Link href={`/compatible/s/${t}`} className="awc-btn awc-btn-primary mt-8 self-start">
            {own ? 'Back to my test' : 'Continue'}
          </Link>
        </div>
      </FlowScreen>
    );
  }

  if (found.joined) {
    return (
      <FlowScreen>
        <div className="flex flex-1 flex-col justify-center text-center">
          <p className="awc-eyebrow">Invitation</p>
          <h1 className="awc-serif mt-3 text-4xl">This invitation has already been accepted</h1>
          <p className="mx-auto mt-4 max-w-sm leading-relaxed text-awc-ink-soft">Each invitation works for one person. If that was you, open the private link you were given when you started. Otherwise, start a test of your own.</p>
          <Link href="/compatible/start" className="awc-btn awc-btn-primary mx-auto mt-8">
            Start my own test
          </Link>
        </div>
      </FlowScreen>
    );
  }

  return (
    <FlowScreen>
      <div className="flex flex-1 flex-col justify-center">
        <JoinFlow invite={invite} inviterName={found.inviter.name} />
      </div>
    </FlowScreen>
  );
}

export default function InvitePage({ params }: PageProps<'/compatible/i/[invite]'>) {
  return (
    <>
      <CompatHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <Invite params={params} />
      </Suspense>
    </>
  );
}
