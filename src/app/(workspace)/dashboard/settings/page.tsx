import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LogOut } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/ProjectGrid';
import { PasswordForm, ProfileForm } from '@/components/dashboard/SettingsForms';
import { getCatalog } from '@/lib/commerce/catalog';
import { requireUser } from '@/lib/server/auth';
import { sqlOne } from '@/lib/server/db';
import { authMode } from '@/lib/server/env';

export const metadata: Metadata = { title: 'Account Settings', robots: { index: false } };

async function Content() {
  const user = await requireUser('/dashboard/settings');
  const profile = await sqlOne<{ full_name: string | null; currency: string | null; marketing_opt_in: boolean }>('select full_name, currency, marketing_opt_in from profiles where user_id = $1', [user.id]);
  const catalog = getCatalog();
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
        <h2 className="mb-6 font-serif text-2xl">Your details</h2>
        <ProfileForm name={profile?.full_name ?? ''} email={user.email} currency={profile?.currency ?? catalog.defaultCurrency} currencies={catalog.currencies} marketing={!!profile?.marketing_opt_in} />
      </section>
      <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
        <h2 className="mb-6 font-serif text-2xl">Password</h2>
        <PasswordForm needsCurrent={authMode === 'local'} />
      </section>
      <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl">Privacy & account</h2>
        <p className="mt-2 text-sm text-ink-soft">Your photos and albums are private to your account. Shared albums are only visible to people with the link (and password, if set).</p>
        <p className="mt-2 text-sm text-ink-soft">To delete your account and all of your photos, contact support from the email address on your account.</p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className="btn btn-secondary btn-sm"><LogOut size={14} /> Log out</button>
        </form>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Account Settings" />
      <Suspense fallback={<div className="h-96 skeleton rounded-3xl" />}>
        <Content />
      </Suspense>
    </>
  );
}
