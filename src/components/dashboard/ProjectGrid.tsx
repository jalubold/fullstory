import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { ProjectSummary } from '@/lib/server/repo/projects';
import { ProjectCard } from './ProjectCard';

export function ProjectGrid({ projects, empty }: { projects: ProjectSummary[]; empty?: { title: string; text: string } }) {
  if (!projects.length) {
    return (
      <div className="rounded-[4px] border border-dashed border-line-strong bg-white/60 px-6 py-16 text-center">
        <p className="font-serif text-3xl">{empty?.title ?? 'No albums yet'}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{empty?.text ?? 'Start with a beautiful template and your favourite photos.'}</p>
        <Link href="/create" className="btn btn-primary mt-6"><Plus size={15} /> Begin a new book</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} p={{ id: p.id, title: p.title, status: p.status, pageCount: p.pageCount, updatedAt: p.updatedAt, cover: p.cover, size: p.size, photos: p.photos }} />
      ))}
    </div>
  );
}

export function PageHeader({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-serif text-4xl font-medium md:text-5xl">{title}</h1>
        {text && <p className="mt-2 text-ink-soft">{text}</p>}
      </div>
      {action}
    </div>
  );
}
