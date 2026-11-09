import Link from 'next/link';
import type { ReactNode } from 'react';
import QRCode from 'qrcode';
import { Check, Download, Layers, Link2, Lock, Music2, PenLine, QrCode, RotateCcw } from 'lucide-react';
import { BookCover, FlatPage, OpenBook } from '@/components/album/Book';
import { HeroFlipBook } from '@/components/marketing/HeroFlipBook';
import { EditorDemo } from '@/components/marketing/EditorDemo';
import { photoUrl } from '@/lib/album/photos';
import { bookFinish } from '@/lib/album/color';
import type { Page, PhotoMap } from '@/lib/album/types';
import { LAYOUTS } from '@/lib/album/layouts';
import { ANIMATIONS } from '@/lib/album/presentation';
import { getCatalog } from '@/lib/commerce/catalog';
import type { TemplateDemo } from '@/lib/templates/demo';
import { BuyButton, type BuyTarget } from './BuyButton';

/** Pages that show photos, for the visuals. */
function photoPages(pages: Page[]) {
  return pages.filter((p) => p.elements.some((e) => e.type === 'photo' && e.photoId));
}

function subset(photos: PhotoMap, pages: Page[]): PhotoMap {
  const ids = new Set(pages.flatMap((p) => p.elements.flatMap((e) => (e.type === 'photo' && e.photoId ? [e.photoId] : []))));
  return Object.fromEntries(Object.entries(photos).filter(([id]) => ids.has(id)));
}

/**
 * The sales page shown before checkout: what one album includes, shown with
 * real pages from the chosen design, then one clear way to buy.
 */
export async function SalesPage({ demo, name, price, target, siteUrl, notice }: { demo: TemplateDemo; name: string; price: string; target: BuyTarget; siteUrl: string; notice?: ReactNode }) {
  const { doc, photos } = demo;
  const withPhotos = photoPages(doc.pages);
  const flipPages = doc.pages.slice(0, 8);
  const qr = await QRCode.toString(siteUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#130c0d', light: '#0000' } });
  const dpi = getCatalog().print.digitalDpi;
  const layoutCount = LAYOUTS.filter((l) => l.group !== 'cover' && l.group !== 'back').length;
  const spread = withPhotos.length >= 2 ? { left: withPhotos[0], right: withPhotos[1] } : { left: doc.pages[0], right: doc.pages[1] ?? null };
  const editorPage = withPhotos.find((p) => p.elements.filter((e) => e.type === 'photo').length === 1) ?? withPhotos[0] ?? doc.pages[0];
  const thumbs = Object.values(photos).slice(0, 4).map((a) => photoUrl(a, 200));
  const buyLabel = `Get started — ${price}`;

  const features: Array<{ icon: typeof Layers; kicker: string; title: ReactNode; text: string; points: string[]; visual: ReactNode }> = [
    {
      icon: Layers,
      kicker: 'Pages',
      title: (
        <>
          As many pages <span className="italic text-accent">as you like.</span>
        </>
      ),
      text: `Start with ${doc.pages.length} beautifully designed pages, then add more whenever your story needs them.`,
      points: [`${layoutCount}+ layouts — single photos, collages, story pages`, 'Reuse your design’s own pages', 'Reorder, duplicate or remove pages any time'],
      visual: (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {withPhotos.slice(0, 6).map((p) => (
            <FlatPage key={p.id} page={p} size={doc.size} photos={photos} renderWidth={200} />
          ))}
        </div>
      ),
    },
    {
      icon: Music2,
      kicker: 'Music',
      title: (
        <>
          Your song plays <span className="italic text-accent">as it opens.</span>
        </>
      ),
      text: 'Choose the song that belongs to these memories. It starts the moment your guests open the album.',
      points: ['Add a song from a link — MP3, Dropbox or Google Drive', 'Plays as the album opens, with a pause button', 'Change it whenever you like'],
      visual: (
        <div className="relative px-2 pb-10 pt-2 sm:px-6">
          <OpenBook left={spread.left} right={spread.right} size={doc.size} photos={photos} renderWidth={560} {...bookFinish(doc)} />
          <div className="absolute bottom-0 left-1/2 flex w-[min(19rem,88%)] -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-white/95 py-2.5 pl-2.5 pr-5 shadow-pop backdrop-blur">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white">
              <Music2 size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">Your song</span>
              <span className="block text-xs text-muted">Now playing</span>
            </span>
            <span className="eq flex h-4 items-end gap-[3px] text-accent" data-playing="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>
      ),
    },
    {
      icon: RotateCcw,
      kicker: 'Page turns',
      title: (
        <>
          Pages that <span className="italic text-accent">really turn.</span>
        </>
      ),
      text: 'Your album opens like a real book — on phones and computers — with a page turn that feels like paper.',
      points: ['A real 3D page turn, on every screen', 'Five styles to choose from', 'Swipe on a phone, click or use the keys on a computer'],
      visual: (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {ANIMATIONS.map((a, i) => {
            const page = withPhotos[i % Math.max(1, withPhotos.length)] ?? doc.pages[i];
            return (
              <div key={a.id} className={`rounded-[8px] p-2 ${i === 0 ? 'bg-accent text-white shadow-pop' : 'bg-white ring-1 ring-line'}`}>
                <div className={i === 0 ? '' : 'opacity-90'}>
                  <FlatPage page={page} size={doc.size} photos={photos} renderWidth={160} />
                </div>
                <p className={`mt-2 text-center text-xs font-medium ${i === 0 ? 'text-white' : 'text-ink'}`}>{a.label}</p>
                <p className={`text-center text-[10px] leading-tight ${i === 0 ? 'text-white/75' : 'text-muted'}`}>{a.hint}</p>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      icon: Link2,
      kicker: 'Share',
      title: (
        <>
          A private link <span className="italic text-accent">and a QR code.</span>
        </>
      ),
      text: 'Send the link to family and friends, or print the QR code on invitations, place cards or a thank-you note.',
      points: ['Private link, ready to send', 'QR code as PNG or SVG for print', 'Optional password and expiry date'],
      visual: (
        <div className="flex items-end justify-center gap-4 sm:gap-8">
          <div className="w-[46%] max-w-[13rem] rounded-[28px] border-[6px] border-ink bg-ink p-1 shadow-[0_30px_60px_-30px_rgb(19_12_13/.6)]">
            <div className="cloth grid aspect-[9/17] place-items-center rounded-[20px] px-4">
              <div className="w-full">
                <BookCover page={doc.cover} size={doc.size} photos={photos} renderWidth={200} />
                <span className="mx-auto mt-4 block w-fit rounded-full bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink">Open the album</span>
              </div>
            </div>
          </div>
          <div className="w-[42%] max-w-[11rem] rounded-[10px] border border-line bg-white p-4 text-center shadow-pop">
            <div className="aspect-square" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="mt-3 font-serif text-lg leading-tight">Scan to open our album</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">fullstory.pro</p>
          </div>
        </div>
      ),
    },
    {
      icon: Download,
      kicker: 'PDF',
      title: (
        <>
          A high-resolution PDF <span className="italic text-accent">to keep.</span>
        </>
      ),
      text: 'Download your whole album — cover, every page and back cover — to keep, archive or print anywhere.',
      points: [`Print quality, ${dpi} dpi`, 'Cover, every page and back cover', 'Always made from your latest version'],
      visual: (
        <div className="relative mx-auto h-[19rem] w-[min(100%,22rem)] sm:h-[22rem]">
          {[withPhotos[2], withPhotos[1], doc.cover].map((p, i) =>
            p ? (
              <div key={i} className="absolute top-6 w-[58%] shadow-[0_24px_40px_-24px_rgb(19_12_13/.45)]" style={{ left: `${8 + i * 14}%`, transform: `rotate(${(i - 1) * 6}deg)`, zIndex: i }}>
                <FlatPage page={p} size={doc.size} photos={photos} renderWidth={240} />
              </div>
            ) : null,
          )}
          <span className="absolute bottom-2 right-4 z-10 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper shadow-pop">
            <Download size={14} /> album.pdf
          </span>
        </div>
      ),
    },
    {
      icon: PenLine,
      kicker: 'Yours',
      title: (
        <>
          Yours to edit, <span className="italic text-accent">any time.</span>
        </>
      ),
      text: 'Swap a photo, rewrite a caption, add a page. Your link and your PDF always show the latest version.',
      points: ['Your photos fill the frames for you', 'Tap any photo to zoom and frame it', 'Saves as you go — on your phone or computer'],
      visual: <EditorDemo page={editorPage} size={doc.size} photos={photos} thumbs={thumbs} />,
    },
  ];

  const faq: Array<[string, string]> = [
    ['Is it a subscription?', `No. You pay ${price} once for this album, taxes included. Everything above is yours — no extras to buy later.`],
    ['What happens after I pay?', 'You go straight into your album to add your photos. Your share link, QR code and PDF are ready whenever you are.'],
    ['Do I need an account?', 'No. Your album is saved in this browser, and a private album link lets you open it on another device.'],
    ['Can I change it after I share it?', 'Yes. Edit any time — the link and the PDF always show the latest version.'],
  ];

  return (
    <div className="pb-28 lg:pb-0">
      {/* Hero: the promise, everything that's included, the price and one button — all above the fold. */}
      <section className="cloth relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_75%_45%,rgb(255_255_255/0.10),transparent_70%)]" />
        <div className="container-page relative grid items-center gap-6 pb-10 pt-7 lg:grid-cols-[1fr_1.05fr] lg:gap-x-14 lg:gap-y-7 lg:py-16">
          <div className="order-1 lg:order-none lg:col-start-1 lg:row-start-1 lg:self-end">
            {notice}
            <p className="smallcaps !text-white/65">{name} · Everything included</p>
            <h1 className="mt-3 font-serif text-[2.75rem] font-medium leading-[0.95] tracking-[-0.015em] md:text-[4.5rem]">
              Make it <span className="italic">yours.</span>
            </h1>
            <p className="mt-4 max-w-lg text-white/80 md:text-[1.0625rem]">Your photos in a professionally designed album — ready to share in minutes.</p>
          </div>

          {/* The product, alive: pages turning, the song playing, a QR code and the PDF, around the open book. */}
          <div className="relative order-3 mx-auto w-full max-w-[23rem] sm:max-w-[38rem] lg:order-none lg:col-start-2 lg:row-span-3 lg:row-start-1">
            <div className="px-2 pb-11 pt-8 sm:px-8 sm:pb-14 sm:pt-10">
              <HeroFlipBook pages={flipPages} size={doc.size} photos={subset(photos, flipPages)} interval={3000} />
            </div>
            <div className="absolute left-0 top-0 flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-ink shadow-pop sm:left-2 sm:top-1">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white">
                <Music2 size={15} />
              </span>
              <span className="text-xs font-medium leading-tight">
                Your song
                <span className="block text-[10px] font-normal text-muted">Now playing</span>
              </span>
              <span className="eq ml-1 flex h-3.5 items-end gap-[2px] text-accent" data-playing="true">
                <span />
                <span />
                <span />
              </span>
            </div>
            <div className="absolute bottom-0 right-0 w-[5.5rem] rounded-[8px] bg-white p-2 text-center shadow-pop sm:right-2 sm:w-[6.5rem]">
              <div className="aspect-square" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.14em] text-ink">Scan to open</p>
            </div>
            <span className="absolute bottom-3 left-0 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-medium text-paper shadow-pop sm:left-2">
              <Download size={13} /> album.pdf
            </span>
          </div>

          <div className="order-2 lg:order-none lg:col-start-1 lg:row-start-2">
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-[12px] border border-white/15 bg-white/[0.07] p-3.5 backdrop-blur-sm sm:gap-x-5 sm:p-5">
              {[
                ['Unlimited pages', '25+ layouts to choose from'],
                ['Your own music', 'Plays as the album opens'],
                ['Real page turns', 'On phones and computers'],
                ['Private link + QR code', 'Share it with anyone'],
                ['High-resolution PDF', 'Download and keep it'],
                ['Edit any time', 'Link and PDF stay up to date'],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white text-accent sm:h-5 sm:w-5">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-[13px] font-medium text-white sm:text-[15px]">{t}</span>
                    <span className="hidden text-xs text-white/60 sm:block">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-4 lg:order-none lg:col-start-1 lg:row-start-3 lg:self-start">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
              <p className="font-serif text-5xl leading-none">{price}</p>
              <BuyButton target={target} label="Get started" className="btn btn-light btn-lg h-14 w-full text-[0.75rem] uppercase tracking-[0.18em] sm:w-auto sm:px-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Each benefit, shown */}
      <section className="bg-paper py-14 lg:py-24">
        <div className="container-page">
          <h2 className="max-w-2xl font-serif text-[2.4rem] font-medium leading-[0.98] tracking-[-0.015em] md:text-6xl">
            Everything’s <span className="italic text-accent">included.</span>
          </h2>
          <p className="mt-4 max-w-xl text-ink-soft md:text-lg">No add-ons, no tiers. Here’s what you get the moment you check out.</p>

          <div className="mt-12 space-y-16 lg:mt-20 lg:space-y-28">
            {features.map((f, i) => (
              <article key={f.kicker} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <div className={i % 2 ? 'lg:order-2' : ''}>
                  <p className="flex items-center gap-2 text-accent">
                    <f.icon size={18} />
                    <span className="smallcaps !text-accent">{String(i + 1).padStart(2, '0')} · {f.kicker}</span>
                  </p>
                  <h3 className="mt-3 font-serif text-[2rem] font-medium leading-[1.02] md:text-5xl">{f.title}</h3>
                  <p className="mt-4 max-w-md leading-relaxed text-ink-soft md:text-lg">{f.text}</p>
                  <ul className="mt-5 space-y-2.5">
                    {f.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5 text-sm text-ink">
                        <Check size={16} className="mt-0.5 shrink-0 text-accent" /> {pt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={i % 2 ? 'lg:order-1' : ''}>{f.visual}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* After you buy */}
      <section className="border-y border-line bg-card py-14 lg:py-20">
        <div className="container-page">
          <h2 className="font-serif text-[2rem] font-medium md:text-5xl">Ready in three steps.</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-[12px] border border-line bg-line md:grid-cols-3 md:rounded-[4px]">
            {[
              [Lock, 'Check out securely', `${price} once — taxes included, no account needed.`],
              [PenLine, 'Add your photos', 'Right after payment you’re in your album. Photos fill the frames for you.'],
              [QrCode, 'Share it', 'Send the link, print the QR code, download the PDF.'],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof Lock;
              return (
                <li key={t as string} className="flex gap-4 bg-paper p-5 md:block md:p-7">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white md:mb-4">
                    <I size={17} />
                  </span>
                  <div>
                    <p className="font-medium text-ink">
                      {i + 1}. {t as string}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{d as string}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Questions */}
      <section className="bg-paper py-14 lg:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <h2 className="font-serif text-[2rem] font-medium leading-tight md:text-5xl">Good to know.</h2>
          <dl className="divide-y divide-line border-y border-line">
            {faq.map(([q, a]) => (
              <div key={q} className="py-5">
                <dt className="font-medium text-ink">{q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-soft">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final call */}
      <section className="cloth relative overflow-hidden py-16 text-center lg:py-24">
        <div className="container-page">
          <div className="mx-auto w-[min(11rem,46vw)]">
            <BookCover page={doc.cover} size={doc.size} photos={photos} renderWidth={240} />
          </div>
          <h2 className="mx-auto mt-8 max-w-2xl font-serif text-[2.4rem] font-medium leading-[0.98] md:text-6xl">
            Your story, <span className="italic">beautifully kept.</span>
          </h2>
          <p className="mt-4 text-white/75">
            {price} one-time · everything included
          </p>
          <div className="mt-8 flex justify-center">
            <BuyButton target={target} label={buyLabel} className="btn btn-light btn-lg h-14 w-full text-[0.75rem] uppercase tracking-[0.18em] sm:w-auto sm:px-10" />
          </div>
          <Link href="/templates" className="mt-6 inline-block text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white/75 hover:text-white">
            <span className="link-underline">See other designs</span>
          </Link>
        </div>
      </section>

      {/* Phones: the way to buy is always one thumb-tap away. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/92 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4 px-4">
          <p className="shrink-0 leading-tight">
            <span className="block font-serif text-2xl text-ink">{price}</span>
            <span className="block text-[11px] text-muted">everything included</span>
          </p>
          <div className="min-w-0 flex-1 [&>div]:w-full">
            <BuyButton target={target} label="Get started" className="btn btn-primary h-12 w-full text-[0.75rem] uppercase tracking-[0.16em]" />
          </div>
        </div>
      </div>
    </div>
  );
}
