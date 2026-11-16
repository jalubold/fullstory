import type { Metadata } from 'next';
import { connection } from 'next/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { JoinFlow } from '@/components/compat/JoinFlow';
import { CompatHeader, FlowScreen, ShellPlaceholder } from '@/components/compat/Shell';
import { InvalidLink } from '@/components/compat/Stages';
import { isLocale, type Locale } from '@/lib/compat/i18n';
import { findByInvite, findByToken } from '@/lib/compat/server/repo';
import { rememberedTokens } from '@/lib/compat/server/view';
import { UI } from '@/lib/compat/ui-strings';

const localeOf = (lang: string): Locale => (isLocale(lang) ? lang : 'en');

export async function generateMetadata({ params }: PageProps<'/compatible/[lang]/i/[invite]'>): Promise<Metadata> {
  const t = UI[localeOf((await params).lang)].meta;
  return { title: t.invited, description: t.invitedDescription, robots: { index: false, follow: false }, referrer: 'no-referrer' };
}

async function Page({ params }: { params: Promise<{ lang: string; invite: string }> }) {
  // Private, per-request data: never prerendered.
  await connection();
  const { lang, invite } = await params;
  const locale = localeOf(lang);
  return (
    <>
      <CompatHeader locale={locale} path={`/i/${invite}`} />
      <Invite invite={invite} locale={locale} />
    </>
  );
}

async function Invite({ invite, locale }: { invite: string; locale: Locale }) {
  const t = UI[locale].join;
  const found = await findByInvite(invite);
  if (!found) return <InvalidLink locale={locale} />;

  // Opened in a browser that already holds a seat in this assessment?
  for (const tok of await rememberedTokens()) {
    const mine = await findByToken(tok);
    if (mine?.assessment.id !== found.assessment.id) continue;
    const own = mine.me.role === 'a';
    return (
      <FlowScreen>
        <div className="flex flex-1 flex-col justify-center">
          <p className="awc-eyebrow">{own ? t.ownEyebrow : t.joinedEyebrow}</p>
          <h1 className="awc-serif mt-3 text-4xl leading-tight">{own ? t.ownTitle : t.joinedTitle(mine.me.name)}</h1>
          <p className="mt-4 leading-relaxed text-awc-ink-soft">{own ? t.ownBody : t.joinedBody}</p>
          <Link href={`/compatible/s/${tok}`} className="awc-btn awc-btn-primary mt-8 self-start">
            {own ? t.ownCta : t.joinedCta}
          </Link>
        </div>
      </FlowScreen>
    );
  }

  if (found.joined) {
    return (
      <FlowScreen>
        <div className="flex flex-1 flex-col justify-center text-center">
          <p className="awc-eyebrow">{t.takenEyebrow}</p>
          <h1 className="awc-serif mt-3 text-4xl">{t.takenTitle}</h1>
          <p className="mx-auto mt-4 max-w-sm leading-relaxed text-awc-ink-soft">{t.takenBody}</p>
          <Link href="/compatible/start" className="awc-btn awc-btn-primary mx-auto mt-8">
            {t.takenCta}
          </Link>
        </div>
      </FlowScreen>
    );
  }

  return (
    <FlowScreen>
      <div className="flex flex-1 flex-col justify-center">
        <JoinFlow invite={invite} inviterName={found.inviter.name} locale={locale} />
      </div>
    </FlowScreen>
  );
}

export default function InvitePage({ params }: PageProps<'/compatible/[lang]/i/[invite]'>) {
  return (
    <Suspense fallback={<ShellPlaceholder />}>
      <Page params={params} />
    </Suspense>
  );
}
