import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, ProjectGrid } from '@/components/dashboard/ProjectGrid';
import { requireUser } from '@/lib/server/auth';
import { listProjects } from '@/lib/server/repo/projects';

export const metadata: Metadata = { title: 'Saved Drafts', robots: { index: false } };

async function List() {
  const user = await requireUser('/dashboard/drafts');
  const projects = await listProjects(user.id, 'draft');
  return <ProjectGrid projects={projects} empty={{ title: 'No drafts', text: 'Albums you start will be saved here until you order them.' }} />;
}

export default function Page() {
  return (
    <>
      <PageHeader title="Saved Drafts" text="Albums you’re still working on. Everything saves automatically." action={<Link href="/create" className="btn btn-primary btn-sm"><Plus size={15} /> Create New Album</Link>} />
      <Suspense fallback={<div className="h-80 skeleton rounded-3xl" />}>
        <List />
      </Suspense>
    </>
  );
}
