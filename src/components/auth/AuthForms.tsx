'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { forgotAction, loginAction, signupAction, type AuthState } from '@/lib/server/actions/auth';

function Alert({ state }: { state: AuthState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">{state.message}</p>;
  return null;
}

function useNext() {
  const params = useSearchParams();
  return params.get('next') ?? '/dashboard';
}

export function LoginForm() {
  const next = useNext();
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className="input" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="password">Password</label>
          <Link href="/forgot-password" className="mb-1.5 text-xs text-muted hover:text-ink">Forgot password?</Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full !py-3.5">
        {pending && <Loader2 size={16} className="animate-spin" />} Log in
      </button>
      <p className="text-center text-sm text-muted">
        New to FULLSTORY?{' '}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-ink underline underline-offset-4">Create an account</Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const next = useNext();
  const [state, action, pending] = useActionState(signupAction, {});
  if (state.message) return <Alert state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input id="name" name="name" autoComplete="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" />
        <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full !py-3.5">
        {pending && <Loader2 size={16} className="animate-spin" />} Create account
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-ink underline underline-offset-4">Log in</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotAction, {});
  return (
    <form action={action} className="space-y-4">
      <Alert state={state} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full !py-3.5">
        {pending && <Loader2 size={16} className="animate-spin" />} Send reset link
      </button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-ink underline underline-offset-4">Back to log in</Link>
      </p>
    </form>
  );
}
