'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { changePasswordAction, updateProfileAction, type FormState } from '@/lib/server/actions/account';

function Msg({ s }: { s: FormState }) {
  if (s.error) return <p role="alert" className="text-sm text-danger">{s.error}</p>;
  if (s.message) return <p role="status" className="text-sm text-success">{s.message}</p>;
  return null;
}

export function ProfileForm({ name, email, currency, currencies, marketing }: { name: string; email: string; currency: string; currencies: string[]; marketing: boolean }) {
  const [state, action, pending] = useActionState(updateProfileAction, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" className="input" defaultValue={name} required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input bg-paper" value={email} readOnly />
        </div>
        <div>
          <label className="label" htmlFor="currency">Preferred currency</label>
          <select id="currency" name="currency" className="input" defaultValue={currency}>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="marketing" defaultChecked={marketing} className="accent-[#25231f]" /> Send me occasional inspiration and offers
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">{pending && <Loader2 size={14} className="animate-spin" />} Save changes</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

export function PasswordForm({ needsCurrent }: { needsCurrent: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {needsCurrent && (
          <div>
            <label className="label" htmlFor="current">Current password</label>
            <input id="current" name="current" type="password" autoComplete="current-password" className="input" required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="next">New password</label>
          <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} className="input" required />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-secondary btn-sm">{pending && <Loader2 size={14} className="animate-spin" />} Change password</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
