import Link from 'next/link';
import { ClothScreen } from '@/components/ui/ClothScreen';

export default function NotFound() {
  return (
    <ClothScreen stamp="404" kicker="A missing page" title={<>This page was never <span className="italic">bound in.</span></>}>
      <p className="mx-auto mt-5 max-w-sm text-white/70">The link may be incomplete, or the page has moved. Everything else is right where you left it.</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <Link href="/" className="btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]">
          Back to the beginning
        </Link>
        <Link href="/templates" className="text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white">
          <span className="link-underline">Browse the collection</span>
        </Link>
      </div>
    </ClothScreen>
  );
}
