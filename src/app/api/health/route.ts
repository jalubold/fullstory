import { connection } from 'next/server';
import { sqlOne } from '@/lib/server/db';
import { dbMode, storageMode } from '@/lib/server/env';

/** Operational check: is the database reachable and which storage is active. Never returns secrets. */
export async function GET() {
  await connection();
  let db: { ok: boolean; error?: string } = { ok: false };
  if (dbMode !== 'none') {
    try {
      await sqlOne('select 1 as ok');
      db = { ok: true };
    } catch (e) {
      const err = e as { code?: string; message?: string };
      db = { ok: false, error: `${err.code ?? ''} ${String(err.message ?? 'error').replace(/postgres(ql)?:\/\/\S+/g, '[url]')}`.trim().slice(0, 160) };
    }
  }
  return Response.json({ dbMode, db, storageMode }, { headers: { 'Cache-Control': 'no-store' } });
}
