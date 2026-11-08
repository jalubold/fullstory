import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/AuthForms';
import { SetupNotice } from '@/components/auth/SetupNotice';
import { setupIssues } from '@/lib/server/env';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-serif text-4xl font-medium">Welcome back</h1>
      <p className="mb-8 mt-2 text-ink-soft">Log in to continue your albums.</p>
      <SetupNotice issues={setupIssues()} />
      <Suspense fallback={<div className="h-72 skeleton rounded-xl" />}>
        <LoginForm />
      </Suspense>
    </>
  );
}
