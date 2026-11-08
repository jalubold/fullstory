'use server';

import { redirect } from 'next/navigation';
import { requestPasswordReset, signIn, signOut, signUp } from '@/lib/server/auth';

export interface AuthState {
  error?: string;
  message?: string;
  email?: string;
}

function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/dashboard';
}

export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Please enter your email and password.', email };
  const res = await signIn(email, password);
  if (!res.ok) return { error: res.error, email };
  redirect(safeNext(form.get('next')));
}

export async function signupAction(_: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!name || !email || !password) return { error: 'Please fill in every field.', email };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Please enter a valid email address.', email };
  const res = await signUp(name, email, password);
  if (!res.ok) return { error: res.error, email };
  if (res.needsConfirmation) return { message: `We’ve sent a confirmation link to ${email}. Open it to activate your account.`, email };
  redirect(safeNext(form.get('next')));
}

export async function forgotAction(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') ?? '').trim();
  if (!email) return { error: 'Please enter your email address.' };
  const res = await requestPasswordReset(email);
  if (!res.ok) return { error: res.error, email };
  return { message: 'If an account exists for that email, you’ll receive a link to reset your password shortly.', email };
}

export async function logoutAction() {
  await signOut();
  redirect('/');
}
