import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
      <div>
        <Logo className="justify-center" />
        <p className="mt-12 font-serif text-7xl italic text-accent">404</p>
        <h1 className="mt-4 font-serif text-4xl">This page isn’t in the album.</h1>
        <p className="mt-3 text-ink-soft">The link may be broken, or the page may have moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-primary">Back home</Link>
          <Link href="/templates" className="btn btn-secondary">Browse templates</Link>
        </div>
      </div>
    </div>
  );
}
