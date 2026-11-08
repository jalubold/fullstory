import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OpenBook } from '@/components/album/Book';
import { EditorDemo } from '@/components/marketing/EditorDemo';
import { HeroFlipBook } from '@/components/marketing/HeroFlipBook';
import { Reveal } from '@/components/motion/Reveal';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { formatMoney, getCatalog, priceIn, printEnabled } from '@/lib/commerce/catalog';
import { lowestPrintPrice } from '@/lib/commerce/pricing';
import type { PhotoMap } from '@/lib/album/types';
import { photoUrl } from '@/lib/album/photos';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { CATEGORIES } from '@/lib/templates/taxonomy';

const FEATURED = ['evermore', 'wanderlust-journal', 'home-and-heart', 'little-wonders', 'us-lately', 'twelve-months'];
const PLATES = [
  { id: 'the-vows', spread: [5, 6], text: 'An editorial wedding story, told in magazine-style chapters.' },
  { id: 'terra', spread: [7, 8], text: 'Gallery margins and quiet type for landscapes and cities.' },
  { id: 'home-and-heart', spread: [3, 4], text: 'A modern family yearbook, season by season.' },
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function subsetPhotos(all: PhotoMap, pages: { elements: { type: string; photoId?: string | null }[] }[]): PhotoMap {
  const ids = new Set<string>();
  for (const p of pages) for (const e of p.elements) if (e.type === 'photo' && e.photoId) ids.add(e.photoId);
  return Object.fromEntries([...ids].filter((id) => all[id]).map((id) => [id, all[id]]));
}

function RunningHead({ chapter, title, aside }: { chapter: number; title: string; aside?: string }) {
  return (
    <Reveal className="running-head">
      <span>
        <span className="text-accent">Chapter {ROMAN[chapter - 1]}</span>
        <span className="mx-3 text-line-strong">/</span>
        {title}
      </span>
      {aside && <span className="hidden sm:inline">{aside}</span>}
    </Reveal>
  );
}

export default function HomePage() {
  const catalog = getCatalog();
  const cur = catalog.defaultCurrency;
  const printFrom = lowestPrintPrice(cur);
  const printOn = printEnabled(catalog);
  const pdf = priceIn(catalog.digital.pdf.price, cur);
  const share = priceIn(catalog.digital.share.price, cur);

  const hero = getTemplateDemo('evermore')!;
  const heroPages = hero.doc.pages.slice(1, 9);
  const heroPhotos = subsetPhotos(hero.photos, heroPages);
  const featured = FEATURED.map((id) => getTemplateDemo(id)!);
  const demoT = getTemplateDemo('slow-days')!;
  const demoPage = demoT.doc.pages.find((p) => p.layoutId === 'single-centered') ?? demoT.doc.pages[1];
  const demoThumbs = Object.values(demoT.photos).slice(0, 4).map((a) => photoUrl(a, 200));
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, TEMPLATES.filter((t) => t.category === c.id).length]));

  return (
    <>
      {/* ───────────── Cover: the open book on red cloth ───────────── */}
      <section className="cloth relative -mt-[calc(4rem+1px)] overflow-hidden pt-[calc(4rem+1px)] md:-mt-[calc(4.5rem+1px)] md:pt-[calc(4.5rem+1px)]">
        <div className="container-page grid min-h-[calc(100svh-8rem)] items-center gap-14 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-16">
          <div>
            <p className="rise smallcaps !text-white/60" style={{ animationDelay: '0.05s' }}>
              The photobook studio
            </p>
            <h1 className="mt-7 font-serif text-[3.6rem] font-medium leading-[0.9] tracking-[-0.02em] sm:text-[5.2rem] lg:text-[6.4rem]">
              <span className="rise block" style={{ animationDelay: '0.15s' }}>Your photos.</span>
              <span className="rise block" style={{ animationDelay: '0.28s' }}>Your story.</span>
              <span className="rise block italic" style={{ animationDelay: '0.41s' }}>Your book.</span>
            </h1>
            <p className="rise mt-8 max-w-md text-[1.0625rem] leading-relaxed text-white/75" style={{ animationDelay: '0.55s' }}>
              Choose a design, drop in your photos and add your words. We bind it into something worth keeping — {printOn ? 'in print, as a PDF, or as a private page-turning album.' : 'a high-resolution PDF and a private, page-turning album to share.'}
            </p>
            <div className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={{ animationDelay: '0.68s' }}>
              <Link href="/create" className="btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]">
                Begin your book
              </Link>
              <Link href="/templates" className="group inline-flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white">
                <span className="link-underline">Browse the collection</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <p className="rise mt-14 text-sm text-white/55" style={{ animationDelay: '0.8s' }}>
              No account <span className="mx-2 text-white/30">·</span> Free to design <span className="mx-2 text-white/30">·</span> {printOn ? 'Print, PDF or private link' : 'PDF or private link'}
            </p>
          </div>

          <div className="book-in relative mx-auto w-full max-w-[46rem] pb-10 lg:pb-0">
            <HeroFlipBook pages={heroPages} size={hero.doc.size} photos={heroPhotos} />
            <div aria-hidden className="mx-auto -mt-2 h-8 w-[86%] rounded-[50%] bg-black/45 blur-2xl" />
          </div>
        </div>
        {/* running foot */}
        <div className="container-page">
          <div className="flex items-center justify-between border-t border-white/15 py-4 text-[0.625rem] font-medium uppercase tracking-[0.22em] text-white/45">
            <span>Fullstory</span>
            <span className="folio !text-white/50">— i —</span>
            <span>Volume one</span>
          </div>
        </div>
      </section>

      {/* ───────────── I. The Collection ───────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page">
          <RunningHead chapter={1} title="The Collection" aside={`${TEMPLATES.length} designs · ${CATEGORIES.length} occasions`} />
          <div className="mt-12 grid items-end gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <Reveal as="h2" className="font-serif text-[2.9rem] font-medium leading-[0.95] tracking-[-0.015em] md:text-7xl">
              A design for every <span className="italic text-accent">chapter</span> of your life.
            </Reveal>
            <Reveal delay={120} as="p" className="max-w-md text-lg leading-relaxed text-ink-soft">
              Complete albums — covers, layouts and typography — ready for your photos the moment you open them. Hover a book to look inside.
            </Reveal>
          </div>
          <Reveal delay={160} className="no-scrollbar -mx-5 mt-12 flex gap-x-7 overflow-x-auto border-y border-line px-5 py-4 md:mx-0 md:flex-wrap md:gap-y-3 md:px-0">
            {CATEGORIES.map((c) => (
              <Link key={c.id} href={`/templates/category/${c.id}`} className="shrink-0 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-accent">
                {c.label}
                <sup className="ml-1 font-serif text-[0.7rem] normal-case tracking-normal text-faint">{counts[c.id]}</sup>
              </Link>
            ))}
          </Reveal>
          <div className="mt-14 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((demo, i) => (
              <Reveal key={demo.template.id} delay={(i % 3) * 110}>
                <TemplateCard demo={demo} />
              </Reveal>
            ))}
          </div>
          <div className="mt-16 flex justify-center">
            <Link href="/templates" className="btn btn-secondary btn-lg text-[0.75rem] uppercase tracking-[0.2em]">
              View all {TEMPLATES.length} designs
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── II. The Studio ───────────── */}
      <section className="border-y border-line bg-card py-20 lg:py-28">
        <div className="container-page">
          <RunningHead chapter={2} title="The Studio" aside="Free to design" />
          <div className="mt-12 grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <Reveal as="h2" className="font-serif text-[2.9rem] font-medium leading-[0.95] tracking-[-0.015em] md:text-7xl">
                Drag. Drop. <span className="italic text-accent">Done.</span>
              </Reveal>
              <Reveal delay={100} as="p" className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
                Every layout, font and colour is already designed — you just bring the photos and the words. Everything saves as you go.
              </Reveal>
              <Reveal delay={160}>
                <ol className="mt-9 max-w-md divide-y divide-line border-y border-line">
                  {[
                    ['Drop in your photos', 'They fill the frames for you — a whole album in seconds.'],
                    ['Tap to swap a photo', 'Choose another from your library, or drag one onto the frame.'],
                    ['Write on the page', 'Tap any caption and type — it stays beautifully set.'],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex gap-5 py-4">
                      <span className="numeral w-6 shrink-0 text-xl">{ROMAN[i].toLowerCase()}.</span>
                      <div>
                        <p className="font-medium text-ink">{t}</p>
                        <p className="mt-0.5 text-sm text-ink-soft">{d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
              <Reveal delay={220}>
                <Link href="/create" className="btn btn-primary btn-lg mt-10 text-[0.75rem] uppercase tracking-[0.2em]">
                  Open the studio
                </Link>
              </Reveal>
            </div>
            <Reveal delay={150}>
              <EditorDemo page={demoPage} size={demoT.doc.size} photos={demoT.photos} thumbs={demoThumbs} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── III. Three steps ───────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page">
          <RunningHead chapter={3} title="How a book is made" aside="About ten minutes" />
          <div className="mt-14 grid md:grid-cols-3">
            {[
              { t: 'Choose a design', d: 'Browse the collection and flip through every page before you begin.' },
              { t: 'Make it yours', d: 'Add your photos, move things around and write your own words.' },
              { t: 'Keep it', d: printOn ? 'Order a printed book, download a print-ready PDF, or share a private link.' : 'Download a high-resolution PDF, or share a private, page-turning link.' },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 130} className={`py-8 md:px-10 md:py-2 ${i ? 'border-t border-line md:border-l md:border-t-0' : 'md:pl-0'}`}>
                <span className="numeral block text-[5.5rem]">{ROMAN[i]}.</span>
                <h3 className="mt-6 font-serif text-3xl">{s.t}</h3>
                <p className="mt-3 max-w-xs leading-relaxed text-ink-soft">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── IV. Plates ───────────── */}
      <section className="overflow-hidden bg-paper-2 py-20 lg:py-28">
        <div className="container-page">
          <RunningHead chapter={4} title="Plates" aside="From the collection" />
          <div className="mt-16 space-y-24 lg:space-y-32">
            {PLATES.map((s, i) => {
              const d = getTemplateDemo(s.id)!;
              return (
                <figure key={s.id} className={`mx-auto max-w-5xl ${i % 2 ? 'lg:pl-24' : 'lg:pr-24'}`}>
                  <Reveal style={{ perspective: '2400px' }}>
                    <OpenBook
                      left={d.doc.pages[s.spread[0]]}
                      right={d.doc.pages[s.spread[1]]}
                      size={d.doc.size}
                      photos={d.photos}
                      renderWidth={1000}
                      style={{ transform: `rotateX(5deg) rotateZ(${i % 2 ? 0.8 : -0.8}deg)` }}
                    />
                  </Reveal>
                  <Reveal as="figcaption" delay={120} className="mt-10 grid gap-3 border-t border-line-strong pt-4 sm:grid-cols-[auto_1fr_auto] sm:items-baseline sm:gap-8">
                    <span className="smallcaps !text-accent">Plate {ROMAN[i]}</span>
                    <span>
                      <span className="font-serif text-2xl text-ink">{d.template.name}</span>
                      <span className="ml-3 text-sm text-ink-soft">{s.text}</span>
                    </span>
                    <Link href={`/templates/${s.id}/preview`} className="group inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink">
                      <span className="link-underline">Flip through</span> <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Reveal>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── V. Keeping it — the price list ───────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page">
          <RunningHead chapter={5} title="Keeping it" aside="Designing is always free" />
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
            <Reveal as="h2" className="font-serif text-[2.9rem] font-medium leading-[0.95] tracking-[-0.015em] md:text-7xl">
              Hold it. Keep it. <span className="italic text-accent">Share it.</span>
            </Reveal>
            <Reveal delay={120}>
              <ul className="border-t border-ink">
                {[
                  { title: 'Printed photobook', text: 'Softcover, hardcover or layflat — printed, bound and delivered.', price: printFrom !== null ? `from ${formatMoney(printFrom, cur)}` : null },
                  { title: printOn ? 'Print-ready PDF' : 'Digital PDF', text: catalog.digital.pdf.description, price: pdf !== null ? formatMoney(pdf, cur) : null },
                  { title: 'Private album link', text: catalog.digital.share.description, price: share !== null ? formatMoney(share, cur) : null },
                ]
                  .filter((o) => printOn || o.title !== 'Printed photobook')
                  .map((o) => (
                  <li key={o.title} className="border-b border-line py-6">
                    <div className="flex items-baseline gap-4">
                      <span className="font-serif text-[1.75rem] leading-none text-ink">{o.title}</span>
                      <span className="leader" />
                      {o.price && <span className="font-serif text-[1.6rem] italic leading-none text-accent">{o.price}</span>}
                    </div>
                    <p className="mt-2 max-w-md text-sm text-ink-soft">{o.text}</p>
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="mt-6 inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink">
                <span className="link-underline">Full price list</span> <ArrowRight size={13} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── Endpaper: final call ───────────── */}
      <section className="cloth relative overflow-hidden py-28 text-center lg:py-36">
        <span aria-hidden className="ribbon absolute left-[9%] top-0 hidden h-[62%] w-7 md:block" />
        <div className="container-page relative">
          <Reveal as="p" className="smallcaps !text-white/60">
            The end — or the beginning
          </Reveal>
          <Reveal as="h2" delay={100} className="mx-auto mt-6 max-w-3xl font-serif text-5xl font-medium leading-[0.95] tracking-[-0.015em] md:text-[5.5rem]">
            Every story deserves <span className="whitespace-nowrap italic">a binding.</span>
          </Reveal>
          <Reveal delay={200} className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
            <Link href="/create" className="btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]">
              Begin your book
            </Link>
            <Link href="/templates" className="text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white">
              <span className="link-underline">Browse the collection</span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
