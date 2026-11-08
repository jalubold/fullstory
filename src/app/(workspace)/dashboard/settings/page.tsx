import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/dashboard/ProjectGrid';
import { RecoveryLink } from '@/components/dashboard/RecoveryLink';
import { ProfileForm } from '@/components/dashboard/SettingsForms';
import { getCatalog } from '@/lib/commerce/catalog';
import { forgetBrowserAction } from '@/lib/server/actions/account';
import { getUser, recoveryToken } from '@/lib/server/auth';
import { sqlOne } from '@/lib/server/db';
import { appUrl } from '@/lib/server/env';

export const metadata: Metadata = { title: 'Settings', robots: { index: false } };

async function Content() {
  const user = await getUser();
  if (!user) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong bg-white/60 px-6 py-14 text-center">
        <p className="font-serif text-3xl">Nothing saved in this browser yet</p>
        <p className="mt-2 text-sm text-ink-soft">Start an album — no account needed. If you made albums elsewhere, open your private album link here.</p>
        <Link href="/create" className="btn btn-primary mt-6">Create an album</Link>
      </div>
    );
  }
  const profile = await sqlOne<{ currency: string | null }>('select currency from profiles where user_id = $1', [user.id]);
  const catalog = getCatalog();
  return (
    <div className="space-y-8">
      <RecoveryLink url={`${appUrl()}/restore/${recoveryToken(user)}`} />
      <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
        <h2 className="mb-2 font-serif text-2xl">Your details</h2>
        <p className="mb-6 text-sm text-ink-soft">Used to pre-fill checkout. We never require an account.</p>
        <ProfileForm name={user.name ?? ''} email={user.email ?? ''} currency={profile?.currency ?? catalog.defaultCurrency} currencies={catalog.currencies} />
      </section>
      <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl">Privacy</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Your photos and albums are private to this browser (and anyone you give your private album link to). Shared albums are only visible to
          people with the share link, and the password if you set one.
        </p>
        <form action={forgetBrowserAction} className="mt-6">
          <button type="submit" className="btn btn-secondary btn-sm">Forget this browser</button>
          <p className="mt-2 text-xs text-muted">Removes access from this browser. Copy your private album link first if you want to come back.</p>
        </form>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <Suspense fallback={<div className="h-96 skeleton rounded-3xl" />}>
        <Content />
      </Suspense>
    </>
  );
}
