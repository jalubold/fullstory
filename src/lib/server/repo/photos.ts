import 'server-only';
import type { PhotoAsset, PhotoMap } from '@/lib/album/types';
import { sql, sqlOne } from '../db';

export type PhotoVariant = 'original' | 'display' | 'thumb';

export interface PhotoRow {
  id: string;
  user_id: string;
  project_id: string;
  filename: string;
  content_type: string;
  size_bytes: string | number;
  width: number;
  height: number;
  storage_prefix: string;
  original_ext: string;
  status: 'pending' | 'ready';
  created_at: string;
}

export const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};
export const MAX_ORIGINAL_BYTES = 40 * 1024 * 1024;
export const MAX_DERIVATIVE_BYTES = 8 * 1024 * 1024;

export function variantKey(p: Pick<PhotoRow, 'storage_prefix' | 'original_ext'>, variant: PhotoVariant): string {
  return variant === 'original' ? `${p.storage_prefix}/original.${p.original_ext}` : `${p.storage_prefix}/${variant}.jpg`;
}

export function variantContentType(p: Pick<PhotoRow, 'content_type'>, variant: PhotoVariant) {
  return variant === 'original' ? p.content_type : 'image/jpeg';
}

export function photoAsset(p: Pick<PhotoRow, 'id' | 'width' | 'height' | 'filename'>, base = '/api/photos'): PhotoAsset {
  return {
    id: p.id,
    width: p.width,
    height: p.height,
    thumbUrl: `${base}/${p.id}/thumb`,
    displayUrl: `${base}/${p.id}/display`,
    placeholder: '#E8E2D8',
    alt: p.filename,
  };
}

export async function createPhoto(input: {
  id: string;
  userId: string;
  projectId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
}): Promise<PhotoRow> {
  const ext = ALLOWED_TYPES[input.contentType];
  const prefix = `u/${input.userId}/p/${input.projectId}/${input.id}`;
  const rows = await sql<PhotoRow>(
    `insert into photos (id, user_id, project_id, filename, content_type, size_bytes, width, height, storage_prefix, original_ext)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [input.id, input.userId, input.projectId, input.filename.slice(0, 200), input.contentType, input.sizeBytes, input.width, input.height, prefix, ext],
  );
  return rows[0];
}

export async function getPhoto(id: string): Promise<PhotoRow | null> {
  return sqlOne<PhotoRow>('select * from photos where id = $1', [id]);
}

export async function markPhotoReady(id: string) {
  await sql(`update photos set status = 'ready' where id = $1`, [id]);
}

export async function listProjectPhotos(projectId: string): Promise<PhotoRow[]> {
  return sql<PhotoRow>(`select * from photos where project_id = $1 and status = 'ready' order by created_at asc`, [projectId]);
}

export async function photoMapFor(ids: string[], base?: string): Promise<PhotoMap> {
  const uuids = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!uuids.length) return {};
  const rows = await sql<PhotoRow>(`select * from photos where id = any($1::uuid[]) and status = 'ready'`, [uuids]);
  return Object.fromEntries(rows.map((r) => [r.id, photoAsset(r, base)]));
}

export async function deletePhotoRow(id: string) {
  await sql('delete from photos where id = $1', [id]);
}
