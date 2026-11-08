import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, ProjectGrid } from '@/components/dashboard/ProjectGrid';
import { requireUser } from '@/lib/server/auth';
import { listProjects } from '@/lib/server/repo/projects';

export const metadata: Metadata = { title: 'Completed', robots: { index: false } };

async function List() {
  const user = await requireUser('/dashboard/completed');
  const projects = await listProjects(user.id, 'completed');
  return <ProjectGrid projects={projects} empty={{ title: 'Nothing completed yet', text: 'When you order an album, it moves here.' }} />;
}

export default function Page() {
  return (
    <>
      <PageHeader title="Completed" text="Albums you’ve bought as a PDF or shareable album." action={<Link href="/create" className="btn btn-primary btn-sm"><Plus size={15} /> Create New Album</Link>} />
      <Suspense fallback={<div className="h-80 skeleton rounded-[4px]" />}>
        <List />
      </Suspense>
    </>
  );
}
