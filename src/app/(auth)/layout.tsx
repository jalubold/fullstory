import { BookCover } from '@/components/album/Book';
import { Logo } from '@/components/ui/Logo';
import { getTemplateDemo } from '@/lib/templates/demo';

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  const a = getTemplateDemo('evermore')!;
  const b = getTemplateDemo('wanderlust-journal')!;
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
        <p className="text-xs text-muted">© 2026 FULLSTORY</p>
      </div>
      <div className="relative hidden overflow-hidden bg-paper-2 lg:block">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/60 blur-3xl" />
        <BookCover page={b.doc.cover} size={b.doc.size} photos={b.photos} renderWidth={480} className="absolute" style={{ width: '58%', left: '30%', top: '14%', transform: 'rotate(6deg)' }} />
        <BookCover page={a.doc.cover} size={a.doc.size} photos={a.photos} renderWidth={420} className="absolute" style={{ width: '44%', left: '12%', top: '40%', transform: 'rotate(-4deg)' }} />
        <p className="absolute bottom-10 left-12 right-12 font-serif text-3xl leading-snug text-ink">“Your photos. Your story. Your book.”</p>
      </div>
    </div>
  );
}
