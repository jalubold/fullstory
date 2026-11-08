import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/AuthForms';
import { SetupNotice } from '@/components/auth/SetupNotice';
import { setupIssues } from '@/lib/server/env';

export const metadata: Metadata = { title: 'Create your account' };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-serif text-4xl font-medium">Create your account</h1>
      <p className="mb-8 mt-2 text-ink-soft">Save your albums and pick up where you left off — free.</p>
      <SetupNotice issues={setupIssues()} />
      <Suspense fallback={<div className="h-80 skeleton rounded-xl" />}>
        <SignupForm />
      </Suspense>
    </>
  );
}
