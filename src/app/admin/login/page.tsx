import type { Metadata } from 'next';
import { AdminLoginForm } from '@/components/dashboard/SettingsForms';
import { Logo } from '@/components/ui/Logo';
import { adminPassword } from '@/lib/server/env';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-5">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="mt-8 rounded-3xl border border-line bg-white p-8">
          <h1 className="mb-6 font-serif text-3xl">Order management</h1>
          {adminPassword ? <AdminLoginForm /> : <p className="text-sm text-ink-soft">Set the ADMIN_PASSWORD environment variable to enable the admin area.</p>}
        </div>
      </div>
    </div>
  );
}
