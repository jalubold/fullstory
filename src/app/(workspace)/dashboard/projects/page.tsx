import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, ProjectGrid } from '@/components/dashboard/ProjectGrid';
import { requireUser } from '@/lib/server/auth';
import { listProjects } from '@/lib/server/repo/projects';

export const metadata: Metadata = { title: 'All albums', robots: { index: false } };

async function List() {
  const user = await requireUser('/dashboard/projects');
  const projects = await listProjects(user.id, undefined);
  return <ProjectGrid projects={projects} />;
}

export default function Page() {
  return (
    <>
      <PageHeader title="All albums" text="Every album you’ve started." action={<Link href="/create" className="btn btn-primary btn-sm"><Plus size={15} /> Create New Album</Link>} />
      <Suspense fallback={<div className="h-80 skeleton rounded-[4px]" />}>
        <List />
      </Suspense>
    </>
  );
}
