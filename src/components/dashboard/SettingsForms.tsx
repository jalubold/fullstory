'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminLoginAction, updateProfileAction, type FormState } from '@/lib/server/actions/account';

function Msg({ s }: { s: FormState }) {
  if (s.error) return <p role="alert" className="text-sm text-danger">{s.error}</p>;
  if (s.message) return <p role="status" className="text-sm text-success">{s.message}</p>;
  return null;
}

export function ProfileForm({ name, email, currency, currencies }: { name: string; email: string; currency: string; currencies: string[] }) {
  const [state, action, pending] = useActionState(updateProfileAction, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name <span className="font-normal text-muted">(optional)</span></label>
          <input id="name" name="name" className="input" defaultValue={name} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email for order updates <span className="font-normal text-muted">(optional)</span></label>
          <input id="email" name="email" type="email" className="input" defaultValue={email} autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="currency">Preferred currency</label>
          <select id="currency" name="currency" className="input" defaultValue={currency}>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">{pending && <Loader2 size={14} className="animate-spin" />} Save</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">Admin password</label>
        <input id="password" name="password" type="password" className="input" required autoFocus autoComplete="current-password" />
      </div>
      <Msg s={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending && <Loader2 size={14} className="animate-spin" />} Open order management</button>
    </form>
  );
}
