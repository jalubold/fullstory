import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingTables } from '@/components/marketing/PricingTables';
import { getCatalog } from '@/lib/commerce/catalog';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple pricing for printed photobooks, digital PDF albums and shareable online albums. Designing is always free.',
};

export default function PricingPage() {
  const catalog = getCatalog();
  return (
    <div className="container-page pb-24 pt-12">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-3 font-serif text-5xl font-medium md:text-6xl">Design for free. Pay when it’s perfect.</h1>
        <p className="mt-4 text-lg text-ink-soft">Choose a printed book, a digital PDF, a shareable online album — or all three.</p>
      </header>
      {catalog.isSample && (
        <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-center text-sm text-warning">
          Sample catalog: prices and product specifications are placeholders set in <code className="font-mono text-xs">src/config/catalog.json</code>.
        </p>
      )}
      <div className="mx-auto mt-12 max-w-5xl">
        <PricingTables catalog={catalog} />
      </div>
      <div className="mx-auto mt-16 max-w-5xl rounded-3xl bg-paper-2 p-10 text-center">
        <h2 className="font-serif text-3xl">Questions about printing or delivery?</h2>
        <p className="mt-2 text-ink-soft">Read our FAQ or start designing — you can change your mind at checkout.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/create" className="btn btn-primary">Create Your Album</Link>
          <Link href="/faq" className="btn btn-secondary">Read the FAQ</Link>
        </div>
      </div>
    </div>
  );
}
