import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

const FEATURED = ['evermore', 'wanderlust-journal', 'home-and-heart', 'little-wonders', 'us-lately', 'twelve-months'];

function subsetPhotos(all: PhotoMap, pages: { elements: { type: string; photoId?: string | null }[] }[]): PhotoMap {
  const ids = new Set<string>();
  for (const p of pages) for (const e of p.elements) if (e.type === 'photo' && e.photoId) ids.add(e.photoId);
  return Object.fromEntries([...ids].filter((id) => all[id]).map((id) => [id, all[id]]));
}

function Label({ children }: { children: string }) {
  return (
    <Reveal as="p" className="smallcaps">
      {children}
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

  return (
    <>
      {/* ───────────── Cover: the open book on red cloth ───────────── */}
      <section className="cloth relative -mt-[calc(4rem+1px)] overflow-hidden pt-[calc(4rem+1px)] md:-mt-[calc(4.5rem+1px)] md:pt-[calc(4.5rem+1px)]">
        <div className="container-page grid items-center gap-12 py-12 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-16">
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
              Pick a design and add your photos. Get {printOn ? 'a printed book, a PDF or a private album to share.' : 'a high-resolution PDF and a private album to share.'}
            </p>
            <div className="rise mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-5" style={{ animationDelay: '0.68s' }}>
              <Link href="/create" className="btn btn-light btn-lg h-14 text-[0.75rem] uppercase tracking-[0.2em] sm:h-auto">
                Begin your book
              </Link>
              <Link href="/templates" className="group inline-flex items-center justify-center gap-2 py-2 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white sm:justify-start">
                <span className="link-underline">Browse the collection</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <p className="rise mt-8 text-center text-sm text-white/55 sm:mt-14 sm:text-left" style={{ animationDelay: '0.8s' }}>
              No account <span className="mx-2 text-white/30">·</span> Free to design <span className="mx-2 text-white/30">·</span> {printOn ? 'Print, PDF or private link' : 'PDF or private link'}
            </p>
          </div>

          <div className="book-in relative mx-auto w-full max-w-[46rem] pb-10 lg:pb-0">
            <HeroFlipBook pages={heroPages} size={hero.doc.size} photos={heroPhotos} />
            <div aria-hidden className="mx-auto -mt-2 h-8 w-[86%] rounded-[50%] bg-black/45 blur-2xl" />
          </div>
        </div>
      </section>

      {/* ───────────── I. The Collection ───────────── */}
      <section className="bg-paper py-14 lg:py-28">
        <div className="container-page">
          <Label>The collection</Label>
          <div className="mt-4 grid items-end gap-4 lg:mt-6 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <Reveal as="h2" className="font-serif text-[2.4rem] font-medium leading-[0.95] tracking-[-0.015em] md:text-7xl">
              A design for every <span className="italic text-accent">chapter</span> of your life.
            </Reveal>
            <Reveal delay={120} as="p" className="max-w-md leading-relaxed text-ink-soft lg:text-lg">
              Complete albums, ready for your photos the moment you open them.
            </Reveal>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-10 sm:gap-y-16 lg:mt-16 lg:grid-cols-3">
            {featured.map((demo, i) => (
              <Reveal key={demo.template.id} delay={(i % 3) * 110}>
                <TemplateCard demo={demo} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex justify-center lg:mt-16">
            <Link href="/templates" className="btn btn-secondary btn-lg w-full text-[0.75rem] uppercase tracking-[0.2em] sm:w-auto">
              View all {TEMPLATES.length} designs
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section className="border-y border-line bg-card py-14 lg:py-28">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          <div>
            <Label>How it works</Label>
            <Reveal as="h2" className="mt-4 font-serif text-[2.4rem] font-medium leading-[0.95] tracking-[-0.015em] lg:mt-6 md:text-7xl">
              Pick. Drop. <span className="italic text-accent">Done.</span>
            </Reveal>
            <Reveal delay={100} as="p" className="mt-4 max-w-md leading-relaxed text-ink-soft lg:mt-6 lg:text-lg">
              Every layout, font and colour is already designed. You bring the photos and the words.
            </Reveal>
            <Reveal delay={160}>
              <ol className="mt-8 max-w-md divide-y divide-line border-y border-line">
                {[
                  ['Choose a design', 'Flip through every page before you begin.'],
                  ['Add your photos', 'They fill the frames for you. Tap any photo to adjust it, any caption to rewrite it.'],
                  ['Keep it', printOn ? 'Order it printed, download a PDF, or share a private link.' : 'Download a high-resolution PDF, or share a private link with a QR code.'],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4 py-4">
                    <span className="numeral w-6 shrink-0 text-xl">{i + 1}.</span>
                    <div>
                      <p className="font-medium text-ink">{t}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
          <Reveal delay={150} className="hidden sm:block">
            <EditorDemo page={demoPage} size={demoT.doc.size} photos={demoT.photos} thumbs={demoThumbs} />
          </Reveal>
        </div>
      </section>

      {/* ───────────── V. Keeping it — the price list ───────────── */}
      <section className="bg-paper py-14 lg:py-28">
        <div className="container-page">
          <Label>Pricing</Label>
          <div className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
            <Reveal as="h2" className="font-serif text-[2.4rem] font-medium leading-[0.95] tracking-[-0.015em] md:text-7xl">
              Free to design. <span className="italic text-accent">Pay when it’s perfect.</span>
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
                  <li key={o.title} className="border-b border-line py-5 lg:py-6">
                    <div className="flex items-baseline gap-4">
                      <span className="font-serif text-[1.5rem] leading-none text-ink lg:text-[1.75rem]">{o.title}</span>
                      <span className="leader" />
                      {o.price && <span className="font-serif text-[1.6rem] italic leading-none text-accent">{o.price}</span>}
                    </div>
                    <p className="mt-2 max-w-md text-sm text-ink-soft">{o.text}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────── Final call ───────────── */}
      <section className="cloth relative overflow-hidden py-20 text-center lg:py-32">
        <span aria-hidden className="ribbon absolute left-[9%] top-0 hidden h-[62%] w-7 md:block" />
        <div className="container-page relative">
          <Reveal as="h2" className="mx-auto max-w-3xl font-serif text-[2.6rem] font-medium leading-[0.95] tracking-[-0.015em] md:text-[5.5rem]">
            Every story deserves <span className="whitespace-nowrap italic">a binding.</span>
          </Reveal>
          <Reveal delay={150} className="mt-10 flex justify-center">
            <Link href="/create" className="btn btn-light btn-lg h-14 w-full text-[0.75rem] uppercase tracking-[0.2em] sm:h-auto sm:w-auto">
              Begin your book
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
