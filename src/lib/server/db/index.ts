import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { databaseUrl, dataDir, dbMode } from '../env';
import { MIGRATIONS } from './schema';

export type Row = Record<string, unknown>;

interface Driver {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Runs fn inside a transaction with a dedicated connection. */
  transaction<T>(fn: (q: Driver['query']) => Promise<T>): Promise<T>;
}

export class SetupError extends Error {
  constructor(message = 'The database is not configured.') {
    super(message);
    this.name = 'SetupError';
  }
}

const g = globalThis as unknown as { __fsDb?: Promise<Driver> };

async function createPgDriver(): Promise<Driver> {
  const { Pool } = await import('pg');
  // Supabase/Vercel URLs carry sslmode params that newer pg versions treat as
  // verify-full; the pooler certificate chain needs relaxed verification.
  const url = new URL(databaseUrl!);
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  for (const p of ['sslmode', 'supa', 'pgbouncer', 'sslrootcert']) url.searchParams.delete(p);
  const pool = new Pool({
    connectionString: url.toString(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    ssl: local ? undefined : { rejectUnauthorized: false },
  });
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const res = await pool.query(text, params as unknown[]);
      return res.rows as T[];
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const result = await fn(async <T,>(text: string, params: unknown[] = []) => (await client.query(text, params as unknown[])).rows as T[]);
        await client.query('commit');
        return result;
      } catch (e) {
        await client.query('rollback').catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

async function createPgliteDriver(): Promise<Driver> {
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = path.join(dataDir, 'pglite');
  fs.mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  let chain: Promise<unknown> = Promise.resolve();
  // PGlite is single-connection; serialise access so transactions don't interleave.
  const serial = <T,>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return next;
  };
  const raw = async <T,>(text: string, params: unknown[] = []) => (await db.query<T>(text, params as unknown[])).rows;
  return {
    query: (text, params) => serial(() => raw(text, params)),
    transaction: (fn) =>
      serial(() =>
        db.transaction(async (tx) => fn(async <T,>(text: string, params: unknown[] = []) => (await tx.query<T>(text, params as unknown[])).rows)),
      ),
  };
}

async function migrate(driver: Driver) {
  await driver.transaction(async (q) => {
    if (dbMode === 'postgres') await q('select pg_advisory_xact_lock(84210931)');
    await q('create table if not exists schema_migrations (id integer primary key, name text not null, applied_at timestamptz not null default now())');
    const applied = new Set((await q<{ id: number }>('select id from schema_migrations')).map((r) => Number(r.id)));
    for (const m of MIGRATIONS) {
      if (applied.has(m.id)) continue;
      // Statements are split so drivers using the extended protocol can run them.
      for (const stmt of m.sql.split(/;\s*\n/).map((x) => x.trim()).filter(Boolean)) await q(stmt);
      await q('insert into schema_migrations (id, name) values ($1, $2)', [m.id, m.name]);
    }
  });
}

async function init(): Promise<Driver> {
  if (dbMode === 'none') throw new SetupError();
  const driver = dbMode === 'postgres' ? await createPgDriver() : await createPgliteDriver();
  await migrate(driver);
  return driver;
}

function driver(): Promise<Driver> {
  if (!g.__fsDb) {
    g.__fsDb = init().catch((e) => {
      g.__fsDb = undefined;
      throw e;
    });
  }
  return g.__fsDb;
}

export async function sql<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await driver()).query<T>(text, params);
}

export async function sqlOne<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await sql<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (q: <R = Row>(text: string, params?: unknown[]) => Promise<R[]>) => Promise<T>): Promise<T> {
  return (await driver()).transaction(fn as never) as Promise<T>;
}
