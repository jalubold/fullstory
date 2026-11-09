import Link from 'next/link';
import { BookCover } from '@/components/album/Book';
import type { TemplateDef } from '@/lib/templates';
import { getTemplateDemo } from '@/lib/templates/demo';

/** Shown in place of the sales page when albums can't be saved on this deployment yet. */
export function StudioClosed({ template }: { template?: TemplateDef }) {
  const demo = template ? getTemplateDemo(template) : null;
  return (
    <section className="cloth relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden">
      <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <p className="smallcaps !text-white/60">The studio</p>
          <h1 className="rise mt-5 font-serif text-5xl font-medium leading-[0.95] sm:text-7xl">
            Opening <span className="italic">very soon.</span>
          </h1>
          <p className="rise mt-6 text-lg text-white/75" style={{ animationDelay: '120ms' }}>
            Saving albums isn’t switched on for this site yet. Every design is ready to explore — flip through the demos and choose your favourite.
          </p>
          <div className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ animationDelay: '220ms' }}>
            {template ? (
              <Link href={`/templates/${template.id}/preview`} className="btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]">
                Flip through {template.name}
              </Link>
            ) : null}
            <Link href="/templates" className={template ? 'text-[0.75rem] font-medium uppercase tracking-[0.2em] text-white' : 'btn btn-light btn-lg text-[0.75rem] uppercase tracking-[0.2em]'}>
              {template ? <span className="link-underline">Browse the collection</span> : 'Browse the collection'}
            </Link>
          </div>
          <p className="mt-14 max-w-md border-t border-white/15 pt-5 text-xs leading-relaxed text-white/45">
            For the site owner: albums and photos need a place to be saved. Connect Supabase in Vercel → Storage, then redeploy. Visitors never need an account.
          </p>
        </div>
        {demo ? (
          <div className="book-in hidden w-[320px] shadow-[0_40px_60px_-30px_rgb(0_0_0/.6)] lg:block">
            <BookCover page={demo.doc.cover} size={demo.doc.size} photos={demo.photos} renderWidth={320} eager />
          </div>
        ) : null}
      </div>
    </section>
  );
}
