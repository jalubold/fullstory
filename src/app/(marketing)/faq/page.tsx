import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { getCatalog } from '@/lib/commerce/catalog';

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description: 'Answers about creating, printing, downloading and sharing photo albums with FULLSTORY.',
};

export default function FaqPage() {
  const c = getCatalog();
  const groups: Array<{ title: string; items: Array<[string, string]> }> = [
    {
      title: 'Creating your album',
      items: [
        ['Do I need an account?', 'No. There’s nothing to sign up for. Your albums are saved to this browser automatically, and you get a private album link to open them on another device.'],
        ['Do I need design experience?', 'Not at all. Every template is a complete, finished design. You simply add your photos and words — and if you want to, you can change layouts, fonts, colours and backgrounds.'],
        ['Is it free to design an album?', 'Yes. Creating, editing, saving and previewing projects is free. You only pay when you order a printed book, a digital PDF or a shareable album.'],
        ['Can I add or remove pages?', `Yes. Albums can have between ${c.pages.min} and ${c.pages.max} pages. You can add, duplicate, delete and reorder pages in the editor.`],
        ['Will I lose my work if I close the browser?', 'No. Your album saves automatically while you work, and a local backup protects changes made while you are offline. Open “My albums” to continue — or use your private album link from another device.'],
        ['Can I use the editor on a tablet or phone?', 'The editor works on desktop computers and tablets. On phones you can browse templates, preview albums and manage your projects; we recommend a larger screen for detailed editing.'],
      ],
    },
    {
      title: 'Photos',
      items: [
        ['Which file types can I upload?', 'JPEG, PNG and WebP images, up to 40 MB each. If your phone saves HEIC photos, export them as JPEG first.'],
        ['How many photos do I need?', 'Each template shows a recommended number of photos on its detail page. As a rough guide, plan for one to three photos per page.'],
        ['Will my photos be printed in good quality?', `The editor warns you when a photo is too small for its frame at print size (below about ${c.print.minDpi} DPI). Print files are produced from your original uploads, not from screen previews.`],
        ['Who can see my photos?', 'Only you. Uploaded photos are stored privately and linked to your browser. If you publish a shareable album, people with the link (and password, if you set one) can view that album.'],
      ],
    },
    {
      title: 'Printing & shipping',
      items: [
        ['Which sizes and covers are available?', `${c.sizes.map((s) => s.label).join(', ')} — in ${c.covers.map((x) => x.label.toLowerCase()).join(', ')}.`],
        ['How long does delivery take?', c.shipping.map((s) => `${s.label}: ${s.estimate}`).join('. ') + '. Production time is shown at checkout.'],
        ['Where do you ship?', `We currently ship to ${c.shippingCountries.length} countries, including the United States, the United Kingdom and most of Europe.`],
        ['Can I track my order?', 'Yes. Your order page in the dashboard shows each stage — processing, in production and shipped — and a tracking link once your book is on its way.'],
      ],
    },
    {
      title: 'Digital PDF & sharing',
      items: [
        ['What is included in the digital PDF?', 'A high-resolution PDF of your finished album — cover, every page and back cover — ready to keep, archive or print at home.'],
        ['How does a shareable album work?', 'You get a private link to an online, page-turning version of your album. You can protect it with a password, set an expiry date, or switch it off at any time.'],
        ['What if I edit my album after buying?', 'Purchases are made for the version of the album at checkout, so the file you receive always matches what you approved. You can keep editing and order again later.'],
      ],
    },
    {
      title: 'Payments & privacy',
      items: [
        ['How do I pay?', 'Payments are handled securely by our payment provider. We never see or store your card details.'],
        ['When do I get access to my download?', 'Immediately after your payment is confirmed. If a payment is still processing, your order page will update automatically.'],
        ['How do I get my albums on another device?', 'Open Settings in “My albums” and copy your private album link. Open it on any device to continue where you left off. Keep it private — anyone with the link can open your albums.'],
      ],
    },
  ];
  return (
    <div className="container-page pb-24 pt-12">
      <header className="max-w-2xl">
        <p className="eyebrow">Help</p>
        <h1 className="mt-3 font-serif text-5xl font-medium md:text-6xl">Frequently asked questions</h1>
        <p className="mt-4 text-lg text-ink-soft">Everything you need to know about making your album.</p>
      </header>
      <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="FAQ sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm">
            {groups.map((g) => (
              <li key={g.title}>
                <a href={`#${g.title.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="text-ink-soft hover:text-ink">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-14">
          {groups.map((g) => (
            <section key={g.title} id={g.title.toLowerCase().replace(/[^a-z]+/g, '-')} className="scroll-mt-24">
              <h2 className="font-serif text-3xl">{g.title}</h2>
              <div className="mt-5 divide-y divide-line rounded-[4px] border border-line bg-white">
                {g.items.map(([q, a]) => (
                  <details key={q} className="group px-6 py-1 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium">
                      {q}
                      <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="pb-5 leading-relaxed text-ink-soft">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <div className="rounded-[4px] bg-paper-2 p-8">
            <p className="font-serif text-2xl">Still have a question?</p>
            <p className="mt-2 text-ink-soft">
              Start a project — it’s free — or <Link href="/how-it-works" className="underline underline-offset-4">see how it works</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
