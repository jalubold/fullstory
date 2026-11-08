import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingTables } from '@/components/marketing/PricingTables';
import { getCatalog } from '@/lib/commerce/catalog';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple pricing for digital PDF albums and shareable online albums. Designing is always free.',
};

export default function PricingPage() {
  const catalog = getCatalog();
  return (
    <div className="container-page pb-16 pt-6 lg:pb-24 lg:pt-14">
      <header className="mx-auto max-w-2xl md:text-center">
        <h1 className="font-serif text-[2.5rem] font-medium leading-none md:text-6xl md:leading-tight">Design for free. Pay when it’s perfect.</h1>
        <p className="mt-4 text-ink-soft md:text-lg">{catalog.print.enabled !== false ? 'Choose a printed book, a digital PDF, a shareable online album — or all three.' : 'Choose a high-resolution PDF, a shareable page-turning album — or both.'}</p>
      </header>
      {catalog.isSample && process.env.NODE_ENV !== 'production' && (
        <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-center text-sm text-warning">
          Sample catalog: prices and product specifications are placeholders set in <code className="font-mono text-xs">src/config/catalog.json</code>.
        </p>
      )}
      <div className="mx-auto mt-8 max-w-5xl md:mt-12">
        <PricingTables catalog={catalog} />
      </div>
      <div className="mx-auto mt-12 flex max-w-5xl flex-col items-center gap-4 md:mt-16">
        <Link href="/create" className="btn btn-primary btn-lg w-full text-[0.75rem] uppercase tracking-[0.18em] sm:w-auto">
          Begin your book — it’s free
        </Link>
        <Link href="/faq" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
          Questions? Read the FAQ
        </Link>
      </div>
    </div>
  );
}
