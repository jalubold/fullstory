import { BookCover, OpenBook } from '@/components/album/Book';
import { getTemplateDemo } from '@/lib/templates/demo';

/** Editorial product composition built from real template pages. */
export function HeroVisual() {
  const open = getTemplateDemo('evermore')!;
  const closed = getTemplateDemo('terra')!;
  const small = getTemplateDemo('little-wonders')!;
  return (
    <div className="relative aspect-[1/0.92] w-full">
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-paper-2">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent-soft blur-3xl" />
        {/* linen texture */}
        <div
          className="absolute inset-0 opacity-[0.35] mix-blend-multiply"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgb(166 140 112 / .08) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgb(166 140 112 / .06) 0 1px, transparent 1px 4px)',
          }}
        />
      </div>
      <BookCover
        page={closed.doc.cover}
        size={closed.doc.size}
        photos={closed.photos}
        renderWidth={420}
        eager
        className="absolute"
        style={{ width: '50%', right: '6%', top: '7%', transform: 'rotate(7deg)' }}
      />
      <BookCover
        page={small.doc.cover}
        size={small.doc.size}
        photos={small.photos}
        renderWidth={240}
        className="absolute hidden sm:block"
        style={{ width: '26%', left: '5%', top: '9%', transform: 'rotate(-6deg)' }}
      />
      <div className="absolute inset-x-[4%] bottom-[7%]" style={{ perspective: '2200px' }}>
        <OpenBook
          left={open.doc.pages[1]}
          right={open.doc.pages[2]}
          size={open.doc.size}
          photos={open.photos}
          renderWidth={900}
          eager
          style={{ transform: 'rotateX(16deg) rotateZ(-3deg)', transformOrigin: '50% 100%' }}
        />
      </div>
    </div>
  );
}
