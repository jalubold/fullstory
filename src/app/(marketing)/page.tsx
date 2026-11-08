import Link from 'next/link';
import { ArrowRight, BookOpen, Download, Link2, Sparkles, Upload, Wand2 } from 'lucide-react';
import { BookCover, OpenBook } from '@/components/album/Book';
import { HeroVisual } from '@/components/marketing/HeroVisual';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { formatMoney, getCatalog, priceIn } from '@/lib/commerce/catalog';
import { lowestPrintPrice } from '@/lib/commerce/pricing';
import { getTemplateDemo } from '@/lib/templates/demo';
import { CATEGORIES } from '@/lib/templates/taxonomy';

const FEATURED = ['evermore', 'wanderlust-journal', 'home-and-heart', 'little-wonders', 'us-lately', 'twelve-months'];
const SHOWCASE = [
  { id: 'the-vows', spread: [5, 6], caption: 'The Vows — an editorial wedding story' },
  { id: 'wanderlust-journal', spread: [1, 2], caption: 'Wanderlust Journal — a kraft-paper travel diary' },
  { id: 'home-and-heart', spread: [3, 4], caption: 'Home & Heart — a modern family yearbook' },
];

export default function HomePage() {
  const catalog = getCatalog();
  const cur = catalog.defaultCurrency;
  const printFrom = lowestPrintPrice(cur);
  const pdf = priceIn(catalog.digital.pdf.price, cur);
  const share = priceIn(catalog.digital.share.price, cur);
  const featured = FEATURED.map((id) => getTemplateDemo(id)!).filter(Boolean);
  const fan = ['the-vows', 'coastlines', 'slow-days'].map((id) => getTemplateDemo(id)!);

  return (
    <>
      {/* Hero */}
      <section className="container-page grid items-center gap-12 pb-20 pt-10 md:pt-16 lg:grid-cols-[1fr_1.08fr] lg:gap-16 lg:pb-28">
        <div className="animate-fade-up">
          <p className="eyebrow">Online photobook maker</p>
          <h1 className="mt-5 font-serif text-[3.1rem] font-medium leading-[0.98] tracking-[-0.015em] text-ink sm:text-[4.4rem] lg:text-[5.1rem]">
            Your photos.
            <br />
            Your story.
            <br />
            <span className="italic text-accent-dark">Your book.</span>
          </h1>
          <p className="mt-7 max-w-lg text-[1.0625rem] leading-relaxed text-ink-soft">
            Create beautiful photo albums from your favourite memories. Choose a design, customise every page, and turn your moments into
            something worth keeping.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/create" className="btn btn-primary btn-lg">
              Create Your Album <ArrowRight size={16} />
            </Link>
            <Link href="/templates" className="btn btn-secondary btn-lg">
              Explore Templates
            </Link>
          </div>
          <ul className="mt-10 grid max-w-lg grid-cols-1 gap-3 text-sm text-muted sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <Sparkles size={15} className="text-accent" /> Free to design
            </li>
            <li className="flex items-center gap-2">
              <Wand2 size={15} className="text-accent" /> No design skills needed
            </li>
            <li className="flex items-center gap-2">
              <BookOpen size={15} className="text-accent" /> Print, download or share
            </li>
          </ul>
        </div>
        <HeroVisual />
      </section>

      {/* Featured templates */}
      <section className="border-t border-line bg-white/50 py-20 lg:py-28">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Templates</p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight md:text-5xl">Find a design for your story.</h2>
              <p className="mt-4 max-w-xl text-ink-soft">
                Every template is a complete, professionally designed album — cover, layouts and typography — ready for your photos.
              </p>
            </div>
            <Link href="/templates" className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-accent-dark">
              Browse all templates <ArrowRight size={15} />
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {CATEGORIES.map((c) => (
              <Link key={c.id} href={`/templates/category/${c.id}`} className="chip">
                {c.label}
              </Link>
            ))}
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((demo) => (
              <TemplateCard key={demo.template.id} demo={demo} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 font-serif text-4xl font-medium md:text-5xl">From camera roll to keepsake in three steps.</h2>
          </div>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            <Step n={1} title="Choose Your Design" text="Explore professionally designed templates for every occasion and preview every page before you begin.">
              <div className="relative h-full">
                {fan.map((d, i) => (
                  <BookCover
                    key={d.template.id}
                    page={d.doc.cover}
                    size={d.doc.size}
                    photos={d.photos}
                    renderWidth={200}
                    className="absolute"
                    style={{
                      width: d.template.orientation === 'landscape' ? '52%' : d.template.orientation === 'portrait' ? '34%' : '40%',
                      left: `${12 + i * 22}%`,
                      top: '50%',
                      transform: `translateY(-50%) rotate(${(i - 1) * 7}deg)`,
                      zIndex: i === 1 ? 2 : 1,
                    }}
                  />
                ))}
              </div>
            </Step>
            <Step n={2} title="Make It Yours" text="Upload your photos, drag them into place, change layouts and add your own words — it all saves automatically.">
              <EditorIllustration />
            </Step>
            <Step n={3} title="Keep Your Memories" text="Download a high-resolution PDF, share a private online album, or order a beautifully printed book.">
              <div className="flex h-full items-center justify-center gap-5">
                {[
                  { icon: BookOpen, label: 'Print' },
                  { icon: Download, label: 'PDF' },
                  { icon: Link2, label: 'Share' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-card">
                      <Icon size={24} strokeWidth={1.4} className="text-accent-dark" />
                    </span>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </Step>
          </div>
          <div className="mt-14 text-center">
            <Link href="/how-it-works" className="btn btn-secondary">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="overflow-hidden bg-paper-2 py-20 lg:py-28">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Showcase</p>
            <h2 className="mt-3 font-serif text-4xl font-medium md:text-5xl">Beautifully designed. Uniquely yours.</h2>
            <p className="mt-4 text-ink-soft">
              Real spreads from FULLSTORY templates. Swap in your own photos and words — the typography, spacing and details stay
              beautifully balanced.
            </p>
          </div>
          <div className="mt-14 space-y-16 lg:space-y-24">
            {SHOWCASE.map((s, i) => {
              const d = getTemplateDemo(s.id)!;
              return (
                <figure key={s.id} className={`grid items-center gap-8 lg:grid-cols-[1.6fr_1fr] ${i % 2 ? 'lg:[&>*:first-child]:order-2 lg:grid-cols-[1fr_1.6fr]' : ''}`}>
                  <div style={{ perspective: '2400px' }}>
                    <OpenBook
                      left={d.doc.pages[s.spread[0]]}
                      right={d.doc.pages[s.spread[1]]}
                      size={d.doc.size}
                      photos={d.photos}
                      renderWidth={1000}
                      style={{ transform: `rotateX(8deg) rotateZ(${i % 2 ? 1.5 : -1.5}deg)` }}
                    />
                  </div>
                  <figcaption className="max-w-sm">
                    <p className="font-serif text-3xl leading-snug">{s.caption.split(' — ')[0]}</p>
                    <p className="mt-2 text-ink-soft">{s.caption.split(' — ')[1]}</p>
                    <div className="mt-5 flex gap-2">
                      <Link href={`/templates/${s.id}/preview`} className="btn btn-secondary btn-sm">
                        Preview album
                      </Link>
                      <Link href={`/templates/${s.id}`} className="btn btn-ghost btn-sm">
                        Details <ArrowRight size={14} />
                      </Link>
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outputs */}
      <section className="py-20 lg:py-28">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Your finished album</p>
            <h2 className="mt-3 font-serif text-4xl font-medium md:text-5xl">Hold it, keep it, share it.</h2>
            <p className="mt-4 text-ink-soft">Designing is always free. Choose how you’d like to keep your album when you’re ready.</p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <OutputCard icon={BookOpen} title="Printed photobook" text="Softcover, hardcover or layflat — printed and bound, delivered to your door." price={printFrom !== null ? `From ${formatMoney(printFrom, cur)}` : null} />
            <OutputCard icon={Download} title="Digital PDF" text={catalog.digital.pdf.description} price={pdf !== null ? formatMoney(pdf, cur) : null} />
            <OutputCard icon={Upload} title="Shareable album" text={catalog.digital.share.description} price={share !== null ? formatMoney(share, cur) : null} />
          </div>
          <p className="mt-8 text-center text-sm">
            <Link href="/pricing" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              See full pricing
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-center text-paper md:px-12 md:py-24">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <p className="eyebrow relative !text-paper/60">Start today — it’s free to design</p>
          <h2 className="relative mx-auto mt-4 max-w-2xl font-serif text-4xl font-medium leading-tight md:text-6xl">Ready to tell your story?</h2>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/create" className="btn btn-accent btn-lg">
              Create Your First Album <ArrowRight size={16} />
            </Link>
            <Link href="/templates" className="btn btn-lg border border-paper/25 text-paper hover:bg-paper/10">
              Browse templates
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Step({ n, title, text, children }: { n: number; title: string; text: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="relative h-56 overflow-hidden rounded-2xl bg-paper-2">{children}</div>
      <p className="mt-6 font-serif text-lg italic text-accent-dark">Step {n}</p>
      <h3 className="mt-1 font-serif text-2xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
    </div>
  );
}

function OutputCard({ icon: Icon, title, text, price }: { icon: typeof BookOpen; title: string; text: string; price: string | null }) {
  return (
    <div className="card flex flex-col p-7">
      <Icon size={26} strokeWidth={1.3} className="text-accent-dark" />
      <h3 className="mt-5 font-serif text-2xl">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{text}</p>
      {price && <p className="mt-6 text-sm font-medium text-ink">{price}</p>}
    </div>
  );
}

function EditorIllustration() {
  return (
    <div className="absolute inset-5 flex gap-3">
      <div className="flex w-10 flex-col gap-2 rounded-xl bg-white p-2 shadow-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`h-6 rounded-md ${i === 1 ? 'bg-accent/30' : 'bg-paper-2'}`} />
        ))}
      </div>
      <div className="relative flex-1 rounded-xl bg-white p-4 shadow-card">
        <div className="grid h-full grid-cols-2 gap-2">
          <div className="rounded-md bg-gradient-to-br from-[#d8c6b0] to-[#b49b80]" />
          <div className="relative rounded-md bg-gradient-to-br from-[#c3cdc0] to-[#8fa08a] outline outline-2 outline-offset-2 outline-accent">
            {['-left-1 -top-1', '-right-1 -top-1', '-left-1 -bottom-1', '-right-1 -bottom-1'].map((p) => (
              <span key={p} className={`absolute ${p} h-2 w-2 rounded-full border border-accent bg-white`} />
            ))}
          </div>
        </div>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[10px] text-paper">Saved</span>
      </div>
    </div>
  );
}
