'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { forgetBrowser, getUser, updateProfile } from '@/lib/server/auth';
import { adminLogin, adminLogout } from '@/lib/server/admin';

export interface FormState {
  ok?: boolean;
  error?: string;
  message?: string;
}

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: 'Create an album first — your details are saved with your albums.' };
  const name = String(form.get('name') ?? '').trim().slice(0, 120);
  const email = String(form.get('email') ?? '').trim().slice(0, 200);
  const currency = String(form.get('currency') ?? '');
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Please enter a valid email address.' };
  await updateProfile(user, { name: name || null, email: email || null, currency: currency || null });
  revalidatePath('/dashboard/settings');
  return { ok: true, message: 'Saved.' };
}

export async function forgetBrowserAction() {
  await forgetBrowser();
  redirect('/');
}

export async function adminLoginAction(_: FormState, form: FormData): Promise<FormState> {
  const ok = await adminLogin(String(form.get('password') ?? ''));
  if (!ok) return { error: 'That password isn’t right.' };
  redirect('/admin/orders');
}

export async function adminLogoutAction() {
  await adminLogout();
  redirect('/');
}
