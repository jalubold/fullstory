'use server';

import { revalidatePath } from 'next/cache';
import { changePassword, getUser } from '@/lib/server/auth';
import { sql } from '@/lib/server/db';

export interface FormState {
  ok?: boolean;
  error?: string;
  message?: string;
}

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: 'Please log in again.' };
  const name = String(form.get('name') ?? '').trim().slice(0, 120);
  const currency = String(form.get('currency') ?? '');
  const marketing = form.get('marketing') === 'on';
  if (!name) return { error: 'Please enter your name.' };
  await sql('update profiles set full_name = $2, currency = $3, marketing_opt_in = $4, updated_at = now() where user_id = $1', [user.id, name, currency || null, marketing]);
  revalidatePath('/dashboard/settings');
  return { ok: true, message: 'Your details have been saved.' };
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: 'Please log in again.' };
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  if (next !== confirm) return { error: 'The new passwords don’t match.' };
  const res = await changePassword(user, current, next);
  return res.ok ? { ok: true, message: 'Your password has been changed.' } : { error: res.error };
}
