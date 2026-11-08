import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ImagePlus, LayoutTemplate, Music2, Type } from 'lucide-react';
import { BookCover, FlatPage, OpenBook } from '@/components/album/Book';
import { getTemplateDemo } from '@/lib/templates/demo';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Choose a design, add your photos, then download a PDF or share a page-turning album.',
};

const STEPS = [
  { title: 'Choose a design', text: 'Every page is already designed. Flip through it before you begin.' },
  { title: 'Add your photos', text: 'They fill the frames for you. Tap a photo to adjust it, tap any text to rewrite it.' },
  { title: 'Keep it', text: 'Download a high-resolution PDF, or share a private, page-turning album with a QR code.' },
];

const FEATURES = [
  { icon: LayoutTemplate, title: 'Frames fill themselves', text: 'Each photo lands in a frame that suits its shape.' },
  { icon: ImagePlus, title: 'Zoom & frame', text: 'Pinch or slide to get every photo just right.' },
  { icon: Type, title: 'Your words', text: 'Rewrite any text — the typography stays as designed.' },
  { icon: Music2, title: 'Music & page turns', text: 'Add a song and choose how your shared album turns.' },
];

export default function HowItWorksPage() {
  const a = getTemplateDemo('home-and-heart')!;
  const b = getTemplateDemo('wanderlust-journal')!;
  const c = getTemplateDemo('slow-days')!;
  return (
    <div className="pb-16 lg:pb-24">
      <section className="container-page grid items-center gap-8 pt-6 md:grid-cols-2 md:gap-12 md:pt-20">
        <div>
          <h1 className="font-serif text-[2.5rem] font-medium leading-[1.02] md:text-6xl">A beautiful album, without the design degree.</h1>
          <p className="mt-4 max-w-lg text-ink-soft md:mt-5 md:text-lg">You bring the photos and the words. The design is already done.</p>
          <Link href="/create" className="btn btn-primary btn-lg mt-7 hidden md:inline-flex">
            Begin your book <ArrowRight size={16} />
          </Link>
        </div>
        <div className="relative h-60 md:h-[26rem]">
          <BookCover page={c.doc.cover} size={c.doc.size} photos={c.photos} renderWidth={320} className="absolute" style={{ width: '34%', left: '4%', top: '6%', transform: 'rotate(-5deg)' }} />
          <div className="absolute inset-x-0 bottom-0" style={{ perspective: '2000px' }}>
            <OpenBook left={a.doc.pages[3]} right={a.doc.pages[4]} size={a.doc.size} photos={a.photos} renderWidth={700} style={{ transform: 'rotateX(12deg) rotateZ(2deg)', width: '86%', marginLeft: 'auto' }} />
          </div>
        </div>
      </section>

      <section className="container-page mt-12 md:mt-24">
        <ol className="grid gap-px overflow-hidden rounded-[12px] border border-line bg-line md:grid-cols-3 md:rounded-[4px]">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 bg-paper p-5 md:block md:p-8">
              <p className="numeral w-8 shrink-0 text-3xl md:text-4xl">{i + 1}.</p>
              <div>
                <h2 className="font-serif text-2xl leading-tight md:mt-4">{s.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft md:mt-3">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 bg-paper-2 py-12 md:mt-24 md:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
          <div>
            <h2 className="font-serif text-[2rem] font-medium leading-tight md:text-5xl">Simple tools, nothing to arrange.</h2>
            <p className="mt-3 text-ink-soft md:mt-4">Works on your phone, tablet or computer. Everything saves as you go.</p>
            <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-6">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon size={20} strokeWidth={1.5} className="text-accent-dark" />
                  <p className="mt-2 font-medium">{title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden grid-cols-3 gap-4 sm:grid">
            {b.doc.pages.slice(1, 7).map((p) => (
              <FlatPage key={p.id} page={p} size={b.doc.size} photos={b.photos} renderWidth={260} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-12 text-center md:mt-20">
        <h2 className="font-serif text-[2rem] md:text-4xl">Ready when you are.</h2>
        <div className="mt-6 flex flex-col items-center gap-4">
          <Link href="/create" className="btn btn-primary btn-lg w-full text-[0.75rem] uppercase tracking-[0.18em] sm:w-auto">
            Begin your book — it’s free
          </Link>
        </div>
      </section>
    </div>
  );
}
