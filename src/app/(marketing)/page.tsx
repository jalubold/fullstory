import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Download, Link2, MousePointerClick, Sparkles, Type, Wand2 } from 'lucide-react';
import { BookCover, OpenBook } from '@/components/album/Book';
import { EditorDemo } from '@/components/marketing/EditorDemo';
import { HeroFlipBook } from '@/components/marketing/HeroFlipBook';
import { ParallaxStage, Reveal } from '@/components/motion/Reveal';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { formatMoney, getCatalog, priceIn } from '@/lib/commerce/catalog';
import { lowestPrintPrice } from '@/lib/commerce/pricing';
import { usedPhotoIds } from '@/lib/album/geometry';
import type { PhotoMap } from '@/lib/album/types';
import { TEMPLATES } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';
import { photoUrl } from '@/lib/album/photos';
import { CATEGORIES } from '@/lib/templates/taxonomy';

const FEATURED = ['evermore', 'wanderlust-journal', 'home-and-heart', 'little-wonders', 'us-lately', 'twelve-months'];
const SHOWCASE = [
  { id: 'the-vows', spread: [5, 6], title: 'The Vows', text: 'An editorial wedding story with magazine-style chapters.' },
  { id: 'terra', spread: [7, 8], title: 'Terra', text: 'Gallery margins and quiet type for landscapes and cities.' },
  { id: 'home-and-heart', spread: [3, 4], title: 'Home & Heart', text: 'A modern family yearbook, season by season.' },
];

function subsetPhotos(all: PhotoMap, pages: Parameters<typeof usedPhotoIds>[0]['pages']): PhotoMap {
  const ids = new Set<string>();
  for (const p of pages) for (const e of p.elements) if (e.type === 'photo' && e.photoId) ids.add(e.photoId);
  return Object.fromEntries([...ids].filter((id) => all[id]).map((id) => [id, all[id]]));
}

export default function HomePage() {
  const catalog = getCatalog();
  const cur = catalog.defaultCurrency;
  const printFrom = lowestPrintPrice(cur);
  const pdf = priceIn(catalog.digital.pdf.price, cur);
  const share = priceIn(catalog.digital.share.price, cur);

  const hero = getTemplateDemo('evermore')!;
  const heroPages = hero.doc.pages.slice(1, 9);
  const heroPhotos = subsetPhotos(hero.photos, heroPages);
  const floatA = getTemplateDemo('coastlines')!;
  const floatB = getTemplateDemo('terra')!;
  const featured = FEATURED.map((id) => getTemplateDemo(id)!);
  const ribbon = TEMPLATES.map((t) => getTemplateDemo(t)!);
  const demoT = getTemplateDemo('slow-days')!;
  const demoPage = demoT.doc.pages.find((p) => p.layoutId === 'single-centered') ?? demoT.doc.pages[1];
  const demoThumbs = Object.values(demoT.photos).slice(0, 4).map((a) => photoUrl(a, 200));
  const final = ['two-of-us', 'ten-years', 'thirty-and-thriving', 'little-things'].map((id) => getTemplateDemo(id)!);

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="grain relative isolate overflow-hidden bg-night text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora absolute -left-[15%] -top-[35%] h-[85%] w-[70%] rounded-full bg-accent/35 blur-[140px]" />
          <div className="aurora absolute -bottom-[40%] right-[-10%] h-[80%] w-[55%] rounded-full bg-violet/25 blur-[140px]" style={{ animationDelay: '-6s' }} />
          <div className="aurora absolute bottom-[-20%] left-[30%] h-[50%] w-[40%] rounded-full bg-rose/15 blur-[140px]" style={{ animationDelay: '-11s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#08080c_100%)]" />
        </div>
        <div className="container-page grid min-h-[calc(100svh-4rem)] items-center gap-12 py-14 md:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[0.95fr_1.15fr] lg:gap-10 lg:py-20">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs tracking-wide text-white/80 backdrop-blur" style={{ animationDelay: '0.05s' }}>
              <Sparkles size={13} className="text-[#a9b0ff]" /> Premium photobooks, designed by you
            </p>
            <h1 className="mt-7 font-serif text-[3.3rem] font-medium leading-[0.95] tracking-[-0.02em] sm:text-[4.6rem] lg:text-[5.6rem]">
              <span className="rise block" style={{ animationDelay: '0.15s' }}>Your photos.</span>
              <span className="rise block" style={{ animationDelay: '0.28s' }}>Your story.</span>
              <span className="rise block pb-2 italic text-gradient" style={{ animationDelay: '0.41s' }}>Your book.</span>
            </h1>
            <p className="rise mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-white/70" style={{ animationDelay: '0.55s' }}>
              Create beautiful photo albums from your favourite memories. Choose a design, customise every page, and turn your moments into
              something worth keeping.
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: '0.68s' }}>
              <Link href="/create" className="btn btn-light btn-lg btn-glow">
                Create Your Album <ArrowRight size={16} />
              </Link>
              <Link href="/templates" className="btn btn-outline-light btn-lg">
                Explore Templates
              </Link>
            </div>
            <ul className="rise mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60" style={{ animationDelay: '0.8s' }}>
              {['Free to design', 'No account needed', 'Print, PDF or share'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check size={14} className="text-[#a9b0ff]" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <ParallaxStage className="relative mx-auto aspect-[1/0.82] w-full max-w-[44rem]">
            <div className="parallax-layer absolute right-[2%] top-[0%] w-[34%]" style={{ ['--depth' as string]: '-18px' }}>
              <div className="drop-in float-slow" style={{ ['--r' as string]: '8deg', ['--r-from' as string]: '22deg', animationDelay: '0.5s' }}>
                <BookCover page={floatA.doc.cover} size={floatA.doc.size} photos={floatA.photos} renderWidth={300} eager className="shine" />
              </div>
            </div>
            <div className="parallax-layer absolute left-[0%] top-[4%] w-[40%]" style={{ ['--depth' as string]: '-12px' }}>
              <div className="drop-in float-slow" style={{ ['--r' as string]: '-7deg', ['--r-from' as string]: '-20deg', animationDelay: '0.7s', animationDuration: '1.5s, 8s' }}>
                <BookCover page={floatB.doc.cover} size={floatB.doc.size} photos={floatB.photos} renderWidth={320} eager className="shine" />
              </div>
            </div>
            <div className="parallax-layer absolute inset-x-[2%] bottom-[2%]" style={{ ['--depth' as string]: '14px' }}>
              <div className="book-in">
                <HeroFlipBook pages={heroPages} size={hero.doc.size} photos={heroPhotos} />
              </div>
              <div aria-hidden className="mx-auto -mt-4 h-10 w-[80%] rounded-[50%] bg-black/60 blur-2xl" />
            </div>
          </ParallaxStage>
        </div>
      </section>

      {/* ───────────── Ribbon of designs ───────────── */}
      <section className="relative overflow-hidden border-b border-line bg-paper py-14">
        <Reveal className="container-page mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">{TEMPLATES.length} designs · {CATEGORIES.length} occasions</p>
            <h2 className="mt-2 font-serif text-3xl font-medium sm:text-4xl">A design for every chapter of your life.</h2>
          </div>
          <Link href="/templates" className="group inline-flex items-center gap-2 text-sm font-medium text-ink">
            See all templates <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <div className="marquee relative [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="marquee-track gap-8 pr-8" style={{ ['--marquee-duration' as string]: '80s' }}>
            {[...ribbon, ...ribbon].map((d, i) => (
              <Link
                key={`${d.template.id}-${i}`}
                href={`/templates/${d.template.id}`}
                aria-hidden={i >= ribbon.length}
                tabIndex={i >= ribbon.length ? -1 : undefined}
                className="group flex h-56 shrink-0 items-end transition-transform duration-500 ease-[var(--ease-soft)] hover:-translate-y-2"
              >
                <BookCover
                  page={d.doc.cover}
                  size={d.doc.size}
                  photos={d.photos}
                  renderWidth={240}
                  className="shine"
                  style={{ height: d.template.orientation === 'portrait' ? '100%' : d.template.orientation === 'square' ? '84%' : '74%', aspectRatio: `${d.doc.size.widthMm} / ${d.doc.size.heightMm}` }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Featured ───────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Templates</p>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-tight md:text-6xl">Find a design for your story.</h2>
            <p className="mt-4 text-lg text-ink-soft">Complete albums — covers, layouts and typography — ready for your photos the moment you open them.</p>
          </Reveal>
          <Reveal delay={100} className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
            {CATEGORIES.map((c) => (
              <Link key={c.id} href={`/templates/category/${c.id}`} className="chip">
                {c.label}
              </Link>
            ))}
          </Reveal>
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((demo, i) => (
              <Reveal key={demo.template.id} delay={(i % 3) * 120} variant="up">
                <TemplateCard demo={demo} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Editing that feels good ───────────── */}
      <section className="grain relative isolate overflow-hidden bg-night py-24 text-white lg:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora absolute -right-[10%] top-[-20%] h-[70%] w-[50%] rounded-full bg-accent/30 blur-[140px]" />
          <div className="aurora absolute -left-[10%] bottom-[-30%] h-[60%] w-[45%] rounded-full bg-rose/15 blur-[140px]" style={{ animationDelay: '-7s' }} />
        </div>
        <div className="container-page grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <p className="eyebrow !text-white/50">The editor</p>
            <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.05] md:text-6xl">
              Drag. Drop. <span className="italic text-gradient">Done.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">
              A beautifully simple editor in your browser. Every layout, font and colour is curated, so whatever you do, it looks designed.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: MousePointerClick, t: 'Drag photos into frames' },
                { icon: Wand2, t: 'Auto-fill a whole album' },
                { icon: Type, t: 'Edit text right on the page' },
                { icon: Sparkles, t: 'Swap layouts, keep your photos' },
              ].map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
                    <Icon size={16} className="text-[#a9b0ff]" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/create" className="btn btn-light btn-lg btn-glow mt-10">
              Start designing — it’s free <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal variant="tilt" delay={150}>
            <EditorDemo page={demoPage} size={demoT.doc.size} photos={demoT.photos} thumbs={demoThumbs} />
          </Reveal>
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 font-serif text-4xl font-medium md:text-6xl">From camera roll to keepsake.</h2>
          </Reveal>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { n: '01', t: 'Choose Your Design', d: 'Explore professionally designed templates and preview every page before you begin.' },
              { n: '02', t: 'Make It Yours', d: 'Upload photos, customise layouts and add your own words. Everything saves automatically.' },
              { n: '03', t: 'Keep Your Memories', d: 'Download a high-resolution PDF, share a private online album, or order a printed book.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 140} className="group relative overflow-hidden rounded-3xl border border-line bg-white p-8 transition duration-500 hover:-translate-y-1 hover:shadow-pop">
                <span className="font-serif text-7xl italic leading-none text-gradient opacity-90">{s.n}</span>
                <h3 className="mt-6 font-serif text-3xl">{s.t}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{s.d}</p>
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-accent via-violet to-rose transition-transform duration-700 group-hover:scale-x-100" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Showcase ───────────── */}
      <section className="overflow-hidden bg-paper-2 py-20 lg:py-28">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Showcase</p>
            <h2 className="mt-3 font-serif text-4xl font-medium md:text-6xl">Beautifully designed. Uniquely yours.</h2>
          </Reveal>
          <div className="mt-16 space-y-20 lg:space-y-28">
            {SHOWCASE.map((s, i) => {
              const d = getTemplateDemo(s.id)!;
              return (
                <div key={s.id} className={`grid items-center gap-10 lg:grid-cols-[1.6fr_1fr] ${i % 2 ? 'lg:grid-cols-[1fr_1.6fr] lg:[&>*:first-child]:order-2' : ''}`}>
                  <Reveal variant="tilt" style={{ perspective: '2400px' }}>
                    <OpenBook
                      left={d.doc.pages[s.spread[0]]}
                      right={d.doc.pages[s.spread[1]]}
                      size={d.doc.size}
                      photos={d.photos}
                      renderWidth={1000}
                      style={{ transform: `rotateX(6deg) rotateZ(${i % 2 ? 1.2 : -1.2}deg)` }}
                    />
                  </Reveal>
                  <Reveal delay={150} variant={i % 2 ? 'left' : 'right'} className="max-w-sm">
                    <p className="font-serif text-4xl">{s.title}</p>
                    <p className="mt-3 text-lg text-ink-soft">{s.text}</p>
                    <div className="mt-6 flex gap-2">
                      <Link href={`/templates/${s.id}/preview`} className="btn btn-primary btn-sm">
                        Flip through it
                      </Link>
                      <Link href={`/templates/${s.id}`} className="btn btn-ghost btn-sm">
                        Details <ArrowRight size={14} />
                      </Link>
                    </div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── Outputs ───────────── */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Your finished album</p>
            <h2 className="mt-3 font-serif text-4xl font-medium md:text-6xl">Hold it. Keep it. Share it.</h2>
            <p className="mt-4 text-lg text-ink-soft">Designing is always free. Choose how to keep your album when you’re ready.</p>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { icon: BookOpen, title: 'Printed photobook', text: 'Softcover, hardcover or layflat — printed and bound, delivered to your door.', price: printFrom !== null ? `From ${formatMoney(printFrom, cur)}` : null },
              { icon: Download, title: 'Digital PDF', text: catalog.digital.pdf.description, price: pdf !== null ? formatMoney(pdf, cur) : null },
              { icon: Link2, title: 'Shareable album', text: catalog.digital.share.description, price: share !== null ? formatMoney(share, cur) : null },
            ].map(({ icon: Icon, title, text, price }, i) => (
              <Reveal key={title} delay={i * 120} className="group flex flex-col rounded-3xl border border-line bg-white p-8 transition duration-500 hover:-translate-y-1 hover:border-accent/30 hover:shadow-pop">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-white">
                  <Icon size={22} strokeWidth={1.6} />
                </span>
                <h3 className="mt-6 font-serif text-3xl">{title}</h3>
                <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{text}</p>
                {price && <p className="mt-6 text-sm font-medium text-ink">{price}</p>}
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-center text-sm">
            <Link href="/pricing" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              See full pricing
            </Link>
          </p>
        </div>
      </section>

      {/* ───────────── Final CTA ───────────── */}
      <section className="container-page pb-24">
        <Reveal variant="scale" className="grain relative isolate overflow-hidden rounded-[2.5rem] bg-night px-6 py-20 text-center text-white md:px-12 md:py-28">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="aurora absolute -left-20 -top-28 h-96 w-96 rounded-full bg-accent/40 blur-[110px]" />
            <div className="aurora absolute -bottom-28 -right-10 h-96 w-96 rounded-full bg-rose/25 blur-[110px]" style={{ animationDelay: '-5s' }} />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
            {final.map((d, i) => (
              <div
                key={d.template.id}
                className="float-slow absolute opacity-80"
                style={{
                  width: d.template.orientation === 'landscape' ? 170 : d.template.orientation === 'portrait' ? 105 : 130,
                  left: i < 2 ? `${4 + i * 9}%` : undefined,
                  right: i >= 2 ? `${4 + (i - 2) * 9}%` : undefined,
                  top: i % 2 ? '58%' : '14%',
                  transform: `rotate(${(i % 2 ? 1 : -1) * (6 + i * 2)}deg)`,
                  animationDelay: `${-i * 1.7}s`,
                }}
              >
                <BookCover page={d.doc.cover} size={d.doc.size} photos={d.photos} renderWidth={180} />
              </div>
            ))}
          </div>
          <p className="eyebrow !text-white/50">Start today — it’s free to design</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-serif text-5xl font-medium leading-[1.02] md:text-7xl">
            Ready to tell <span className="italic text-gradient">your story?</span>
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/create" className="btn btn-light btn-lg btn-glow">
              Create Your First Album <ArrowRight size={16} />
            </Link>
            <Link href="/templates" className="btn btn-outline-light btn-lg">
              Browse templates
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
