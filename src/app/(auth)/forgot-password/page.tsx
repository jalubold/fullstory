import type { Metadata } from 'next';
import { ForgotForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPage() {
  return (
    <>
      <h1 className="font-serif text-4xl font-medium">Reset your password</h1>
      <p className="mb-8 mt-2 text-ink-soft">Enter the email you signed up with and we’ll send you a reset link.</p>
      <ForgotForm />
    </>
  );
}
