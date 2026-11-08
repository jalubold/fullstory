import 'server-only';
import crypto from 'node:crypto';
import { usedPhotoIds } from '@/lib/album/geometry';
import type { AlbumDocument, Page, PageSize, PhotoMap } from '@/lib/album/types';
import { sql, sqlOne, transaction } from '../db';
import { photoMapFor } from './photos';
import { NO_GUEST_ID } from '../auth/guest-id';

export type ProjectStatus = 'draft' | 'completed' | 'archived';

export interface ProjectRow {
  id: string;
  user_id: string;
  title: string;
  template_id: string | null;
  status: ProjectStatus;
  document: AlbumDocument;
  version: number;
  page_count: number;
  size_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  templateId: string | null;
  status: ProjectStatus;
  pageCount: number;
  sizeId: string;
  createdAt: string;
  updatedAt: string;
  cover: Page;
  size: PageSize;
  photos: PhotoMap;
  hasOrders: boolean;
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));

/**
 * Creates an album. With a clientKey the call is idempotent per guest: a
 * retried or duplicated request returns the album the first one created.
 */
export async function createProject(userId: string, title: string, doc: AlbumDocument, clientKey?: string | null): Promise<ProjectRow> {
  const id = crypto.randomUUID();
  const rows = await sql<ProjectRow>(
    `insert into projects (id, user_id, title, template_id, document, page_count, size_id, client_key)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (user_id, client_key) where client_key is not null do nothing
     returning *`,
    [id, userId, title.slice(0, 120), doc.templateId, JSON.stringify(doc), doc.pages.length, doc.size.id, clientKey ?? null],
  );
  if (rows[0]) return rows[0];
  const existing = await sqlOne<ProjectRow>('select * from projects where user_id = $1 and client_key = $2', [userId, clientKey]);
  if (!existing) throw new Error('Could not create the album.');
  return existing;
}

/** Returns the project only if it belongs to the user. */
export async function getProject(userId: string, id: string): Promise<ProjectRow | null> {
  if (userId === NO_GUEST_ID || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return sqlOne<ProjectRow>('select * from projects where id = $1 and user_id = $2 and deleted_at is null', [id, userId]);
}

export type SaveResult = { ok: true; version: number; updatedAt: string } | { ok: false; conflict: true; version: number };

/** Optimistic-concurrency save: rejects writes based on a stale version. */
export async function saveProject(userId: string, id: string, doc: AlbumDocument, title: string | undefined, expectedVersion: number): Promise<SaveResult | null> {
  return transaction(async (q) => {
    const rows = await q<{ version: number }>('select version from projects where id = $1 and user_id = $2 and deleted_at is null for update', [id, userId]);
    if (!rows[0]) return null;
    if (Number(rows[0].version) !== expectedVersion) return { ok: false, conflict: true, version: Number(rows[0].version) };
    const updated = await q<{ version: number; updated_at: string }>(
      `update projects set document = $3, title = coalesce($4, title), version = version + 1, page_count = $5, size_id = $6,
         template_id = $7, updated_at = now() where id = $1 and user_id = $2 returning version, updated_at`,
      [id, userId, JSON.stringify(doc), title?.slice(0, 120) ?? null, doc.pages.length, doc.size.id, doc.templateId],
    );
    return { ok: true, version: Number(updated[0].version), updatedAt: iso(updated[0].updated_at) };
  });
}

export async function updateProjectMeta(userId: string, id: string, patch: { title?: string; status?: ProjectStatus }) {
  await sql(
    `update projects set title = coalesce($3, title), status = coalesce($4, status), updated_at = now()
     where id = $1 and user_id = $2 and deleted_at is null`,
    [id, userId, patch.title?.slice(0, 120) ?? null, patch.status ?? null],
  );
}

export async function deleteProject(userId: string, id: string) {
  await sql('update projects set deleted_at = now() where id = $1 and user_id = $2', [id, userId]);
}

export async function duplicateProject(userId: string, id: string): Promise<ProjectRow | null> {
  const src = await getProject(userId, id);
  if (!src) return null;
  // Photos are shared by reference within the same account.
  const copy = await createProject(userId, `${src.title} (copy)`, src.document);
  await sql(
    `insert into photos (id, user_id, project_id, filename, content_type, size_bytes, width, height, storage_prefix, original_ext, status, created_at)
     select gen_random_uuid(), user_id, $2, filename, content_type, size_bytes, width, height, storage_prefix, original_ext, status, created_at
     from photos where project_id = $1 and status = 'ready'`,
    [id, copy.id],
  );
  // Remap photo ids in the copied document.
  const map = await sql<{ old_id: string; new_id: string }>(
    `select a.id as old_id, b.id as new_id from photos a join photos b on b.storage_prefix = a.storage_prefix and b.project_id = $2
     where a.project_id = $1`,
    [id, copy.id],
  );
  const remap = new Map(map.map((m) => [m.old_id, m.new_id]));
  const doc = structuredClone(src.document);
  for (const page of [doc.cover, ...doc.pages, doc.backCover]) {
    for (const el of page.elements) if (el.type === 'photo' && el.photoId) el.photoId = remap.get(el.photoId) ?? el.photoId;
  }
  await sql('update projects set document = $2 where id = $1', [copy.id, JSON.stringify(doc)]);
  return { ...copy, document: doc };
}

export async function listProjects(userId: string, status?: ProjectStatus): Promise<ProjectSummary[]> {
  if (userId === NO_GUEST_ID) return [];
  const rows = await sql<{
    id: string;
    title: string;
    template_id: string | null;
    status: ProjectStatus;
    page_count: number;
    size_id: string;
    created_at: string;
    updated_at: string;
    cover: Page;
    size: PageSize;
    has_orders: boolean;
  }>(
    `select p.id, p.title, p.template_id, p.status, p.page_count, p.size_id, p.created_at, p.updated_at,
            p.document->'cover' as cover, p.document->'size' as size,
            exists(select 1 from orders o where o.project_id = p.id and o.status = 'paid') as has_orders
     from projects p where p.user_id = $1 and p.deleted_at is null ${status ? 'and p.status = $2' : `and p.status <> 'archived'`}
     order by p.updated_at desc`,
    status ? [userId, status] : [userId],
  );
  const ids = new Set<string>();
  for (const r of rows) for (const el of r.cover.elements) if (el.type === 'photo' && el.photoId) ids.add(el.photoId);
  const photos = await photoMapFor([...ids]);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    templateId: r.template_id,
    status: r.status,
    pageCount: Number(r.page_count),
    sizeId: r.size_id,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    cover: r.cover,
    size: r.size,
    photos,
    hasOrders: !!r.has_orders,
  }));
}

export async function documentPhotoMap(doc: AlbumDocument, base?: string): Promise<PhotoMap> {
  return photoMapFor([...usedPhotoIds(doc)], base);
}
