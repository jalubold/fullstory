import crypto from 'node:crypto';
import { connection } from 'next/server';
import { sqlOne } from '@/lib/server/db';
import { getPaymentProvider } from '@/lib/server/payments';
import { CreemProvider } from '@/lib/server/payments/creem';
import { dbMode, storageMode } from '@/lib/server/env';
import { storage } from '@/lib/server/storage';

const clean = (e: unknown) => {
  const err = e as { code?: string; message?: string };
  return `${err.code ?? ''} ${String(err.message ?? 'error').replace(/postgres(ql)?:\/\/\S+/g, '[url]')}`.trim().slice(0, 160);
};

/**
 * Operational check: database reachability and active storage. With ?deep=1 it
 * also round-trips a tiny file through storage (write, sign, read, delete).
 * Never returns secrets.
 */
export async function GET(req: Request) {
  await connection();
  let db: { ok: boolean; error?: string } = { ok: false };
  if (dbMode !== 'none') {
    try {
      await sqlOne('select 1 as ok');
      db = { ok: true };
    } catch (e) {
      db = { ok: false, error: clean(e) };
    }
  }
  let store: { ok: boolean; steps?: string[]; error?: string } | undefined;
  if (new URL(req.url).searchParams.get('deep') === '1' && storageMode !== 'none') {
    const steps: string[] = [];
    const key = `health/${crypto.randomUUID()}.txt`;
    try {
      const s = storage();
      await s.put(key, Buffer.from('ok'), 'text/plain');
      steps.push('put');
      if (!(await s.exists(key))) throw new Error('written file not found');
      steps.push('exists');
      const signed = await s.signedUrl(key, 60);
      if (signed) {
        const res = await fetch(signed);
        if (!res.ok || (await res.text()) !== 'ok') throw new Error(`signed read failed (${res.status})`);
        steps.push('signed-read');
      }
      const got = await s.get(key);
      if (got?.toString() !== 'ok') throw new Error('read failed');
      steps.push('get');
      await s.uploadTarget(`health/${crypto.randomUUID()}.jpg`, '/');
      steps.push('upload-token');
      await s.remove([key]);
      steps.push('remove');
      store = { ok: true, steps };
    } catch (e) {
      store = { ok: false, steps, error: clean(e) };
    }
  }
  // Payments: which provider is active and whether it's set up. Flags only — never key values.
  const provider = getPaymentProvider();
  const payments: { provider: string | null; test?: boolean; webhook?: boolean; api?: string } = { provider: provider?.id ?? null };
  if (provider) payments.test = provider.isTest;
  if (provider instanceof CreemProvider) {
    payments.webhook = Boolean(process.env.CREEM_WEBHOOK_SECRET);
    if (new URL(req.url).searchParams.get('deep') === '1') payments.api = await provider.ping();
  }
  return Response.json({ dbMode, db, storageMode, store, payments }, { headers: { 'Cache-Control': 'no-store' } });
}
