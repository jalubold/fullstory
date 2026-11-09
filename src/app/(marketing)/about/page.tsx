import type { Metadata } from 'next';
import Link from 'next/link';
import { BookCover } from '@/components/album/Book';
import { getTemplateDemo } from '@/lib/templates/demo';

export const metadata: Metadata = {
  title: 'About',
  description: 'FULLSTORY helps people turn their photos into beautiful books — designed by them, in the browser.',
};

const VALUES = [
  { title: 'Made to be kept', text: 'Photos on a phone are easy to take and easy to forget. A book is something you return to, and pass on.' },
  { title: 'Design that steps back', text: 'Our templates are built to make your photographs look their best — calm typography, balanced spacing, no clutter.' },
  { title: 'Yours, privately', text: 'No accounts, no passwords. Your photos and albums stay private to you, and nothing is shared unless you publish a link.' },
  { title: 'Honest pricing', text: 'One price per album with everything included, shown before you start. No subscriptions, no extras.' },
];

export default function AboutPage() {
  const covers = ['evermore', 'terra', 'little-wonders', 'ten-years', 'slow-days'].map((id) => getTemplateDemo(id)!);
  return (
    <div className="pb-24">
      <section className="container-page pt-6 md:pt-20">
        <p className="eyebrow">About FULLSTORY</p>
        <h1 className="mt-3 max-w-4xl font-serif text-[2.75rem] font-medium md:mt-4 leading-[1.02] md:text-7xl">
          We believe every life deserves a <span className="italic text-accent-dark">beautiful book.</span>
        </h1>
        <div className="mt-10 grid gap-8 text-lg leading-relaxed text-ink-soft md:grid-cols-2">
          <p>
            We take more photographs than any generation before us, and look at fewer of them. They sit in camera rolls and cloud folders,
            thousands deep, waiting for a moment that rarely comes.
          </p>
          <p>
            FULLSTORY exists to make that moment easy. Choose a design made by people who care about typography and white space, add your
            photos and your words, and keep the result for good.
          </p>
        </div>
      </section>

      <section className="mt-20 overflow-hidden bg-paper-2 py-16">
        <div className="flex items-center justify-center gap-6 px-6 md:gap-10">
          {covers.map((d, i) => (
            <BookCover
              key={d.template.id}
              page={d.doc.cover}
              size={d.doc.size}
              photos={d.photos}
              renderWidth={260}
              className="shrink-0"
              style={{
                width: d.template.orientation === 'landscape' ? 300 : d.template.orientation === 'portrait' ? 170 : 220,
                transform: `rotate(${(i - 2) * 2.5}deg) translateY(${Math.abs(i - 2) * 8}px)`,
              }}
            />
          ))}
        </div>
      </section>

      <section className="container-page mt-20">
        <p className="font-serif text-3xl italic text-accent-dark">Your photos. Your story. Your book.</p>
        <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="border-t border-line pt-6">
              <h2 className="font-serif text-3xl">{v.title}</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-24 rounded-[4px] bg-ink px-8 py-16 text-center text-paper">
        <h2 className="font-serif text-4xl md:text-5xl">Start your first chapter.</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/create" className="btn btn-accent btn-lg">Create an album</Link>
          <Link href="/templates" className="btn btn-lg border border-paper/25 text-paper hover:bg-paper/10">Browse templates</Link>
        </div>
      </section>
    </div>
  );
}
