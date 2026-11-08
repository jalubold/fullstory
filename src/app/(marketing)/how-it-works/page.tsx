import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CloudUpload, Eye, ImagePlus, LayoutTemplate, Music2, Save, Type } from 'lucide-react';
import { BookCover, FlatPage, OpenBook } from '@/components/album/Book';
import { getTemplateDemo } from '@/lib/templates/demo';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Choose a template, add your photos, rewrite the words, then download a PDF or share a page-turning album.',
};

const STEPS = [
  { title: 'Choose your design', text: 'Browse templates by occasion or style and preview every page with real photography. Pick a size and start your project in one click.' },
  { title: 'Add your photos', text: 'Pick photos from your phone or computer. They appear instantly, fill the frames for you and upload privately in the background.' },
  { title: 'Make it yours', text: 'Tap any photo to swap it, tap any text to rewrite it, and choose music and a page-turn style. The design stays exactly as it was made — nothing to arrange.' },
  { title: 'Review the full album', text: 'Flip through every spread exactly as it will look — front cover to back — and fix anything before you order.' },
  { title: 'Download or share', text: 'Download a high-resolution PDF, or publish a private, page-turning album to share with family.' },
];

const FEATURES = [
  { icon: CloudUpload, title: 'Add dozens at once', text: 'Pick a whole camera roll. Photos appear instantly and upload in the background.' },
  { icon: LayoutTemplate, title: 'Auto-fill', text: 'Photos drop into the frames for you, matched to each frame’s shape.' },
  { icon: ImagePlus, title: 'Swap any photo', text: 'Tap a photo to choose another — or drag one onto the frame on a computer.' },
  { icon: Type, title: 'Write on the page', text: 'Tap any text to rewrite it. The typography stays exactly as designed.' },
  { icon: Music2, title: 'Music & page turns', text: 'Add a song from a link and choose how the pages turn in your shared album.' },
  { icon: Save, title: 'Autosave & undo', text: 'Everything saves as you go, and any change can be undone.' },
];

export default function HowItWorksPage() {
  const a = getTemplateDemo('home-and-heart')!;
  const b = getTemplateDemo('wanderlust-journal')!;
  const c = getTemplateDemo('slow-days')!;
  return (
    <div className="pb-24">
      <section className="container-page grid items-center gap-12 pt-12 md:grid-cols-2 md:pt-20">
        <div>
          <p className="eyebrow">How it works</p>
          <h1 className="mt-3 font-serif text-5xl font-medium leading-[1.02] md:text-6xl">A beautiful album, without the design degree.</h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            FULLSTORY gives you professionally designed templates and a friendly editor that runs in your browser. You bring the photos and
            the stories — we make sure everything looks considered.
          </p>
          <Link href="/create" className="btn btn-primary btn-lg mt-8">
            Start your album <ArrowRight size={16} />
          </Link>
        </div>
        <div className="relative h-80 md:h-[26rem]">
          <BookCover page={c.doc.cover} size={c.doc.size} photos={c.photos} renderWidth={320} className="absolute" style={{ width: '34%', left: '4%', top: '6%', transform: 'rotate(-5deg)' }} />
          <div className="absolute inset-x-0 bottom-0" style={{ perspective: '2000px' }}>
            <OpenBook left={a.doc.pages[3]} right={a.doc.pages[4]} size={a.doc.size} photos={a.photos} renderWidth={700} style={{ transform: 'rotateX(12deg) rotateZ(2deg)', width: '86%', marginLeft: 'auto' }} />
          </div>
        </div>
      </section>

      <section className="container-page mt-24">
        <ol className="grid gap-px overflow-hidden rounded-[4px] border border-line bg-line md:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="bg-paper p-7">
              <p className="numeral text-4xl">{['I', 'II', 'III', 'IV', 'V'][i]}.</p>
              <h2 className="mt-4 font-serif text-2xl leading-tight">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-24 bg-paper-2 py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">The editor</p>
            <h2 className="mt-3 font-serif text-4xl font-medium md:text-5xl">Simple tools, carefully chosen.</h2>
            <p className="mt-4 text-ink-soft">
              Everything you need to finish a photobook — and nothing that gets in the way. No dragging boxes around, no design decisions: the
              editor works on your phone, tablet or computer, and your albums are always waiting in “My albums”.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <Icon size={20} strokeWidth={1.5} className="text-accent-dark" />
                  <p className="mt-2 font-medium">{title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {b.doc.pages.slice(1, 7).map((p) => (
              <FlatPage key={p.id} page={p} size={b.doc.size} photos={b.photos} renderWidth={260} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-24 grid gap-6 md:grid-cols-3">
        {[
          { icon: Eye, title: 'Preview before you pay', text: 'See your finished album page by page, in spreads or single pages, before choosing a format.' },
          { icon: Save, title: 'Full-resolution files', text: 'Your PDF is rendered from your full-size photos — not a screenshot of the editor.' },
          { icon: CloudUpload, title: 'Private by default', text: 'Your photos are only visible to you, unless you choose to publish a share link.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-7">
            <Icon size={22} strokeWidth={1.4} className="text-accent-dark" />
            <h3 className="mt-4 font-serif text-2xl">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
          </div>
        ))}
      </section>

      <section className="container-page mt-20 text-center">
        <h2 className="font-serif text-4xl">Ready when you are.</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/create" className="btn btn-primary btn-lg">Begin your book</Link>
          <Link href="/pricing" className="btn btn-secondary btn-lg">See pricing</Link>
        </div>
      </section>
    </div>
  );
}
