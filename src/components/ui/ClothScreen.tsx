import Link from 'next/link';
import { Logo } from './Logo';

/**
 * A full-screen page of bookcloth for the moments outside an album:
 * a missing page, an interruption, a private share link.
 */
export function ClothScreen({
  kicker,
  title,
  stamp,
  children,
  colophon = false,
}: {
  kicker?: string;
  title: React.ReactNode;
  /** Large blind-stamped lettering above the title, e.g. "404". */
  stamp?: string;
  children?: React.ReactNode;
  /** Show a quiet "Bound with FULLSTORY" line at the foot (for pages people reach from a shared link). */
  colophon?: boolean;
}) {
  return (
    <main className="cloth relative flex min-h-dvh flex-col items-center overflow-hidden px-5 text-center">
      <span aria-hidden className="ribbon ribbon-ink absolute left-[14%] top-0 h-28 w-4 sm:left-[22%] sm:h-44 sm:w-5" />
      <div className="relative pt-10">
        <Logo tone="light" />
      </div>
      <div className="rise relative my-auto w-full max-w-md py-16">
        {stamp && (
          <p aria-hidden className="stamp select-none font-serif text-[7.5rem] font-medium italic leading-none sm:text-[10rem]">
            {stamp}
          </p>
        )}
        {kicker && <p className={`smallcaps !text-white/55 ${stamp ? 'mt-6' : ''}`}>{kicker}</p>}
        <h1 className="mt-4 text-balance font-serif text-4xl font-medium leading-[1.05] sm:text-5xl">{title}</h1>
        {children}
      </div>
      {colophon && (
        <p className="relative pb-8 text-[0.6875rem] uppercase tracking-[0.2em] text-white/40">
          Bound with{' '}
          <Link href="/" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
            Fullstory
          </Link>
        </p>
      )}
    </main>
  );
}
