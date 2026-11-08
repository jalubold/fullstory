import 'server-only';

/**
 * Central runtime configuration. Every integration is optional and detected
 * from environment variables, so the same build runs locally (embedded
 * Postgres + filesystem storage + local auth) and in production (Supabase).
 */

const env = (...names: string[]) => {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return undefined;
};

export const isProduction = process.env.NODE_ENV === 'production';
export const isVercel = process.env.VERCEL === '1';

export const supabaseUrl = env('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
export const supabaseServiceKey = env('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY');
export const databaseUrl = env('DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL');
export const storageBucket = env('SUPABASE_STORAGE_BUCKET') ?? 'fullstory';

export type DbMode = 'postgres' | 'pglite' | 'none';
export type StorageMode = 'supabase' | 'local' | 'none';

export const dbMode: DbMode = databaseUrl ? 'postgres' : !isVercel ? 'pglite' : 'none';
export const storageMode: StorageMode = supabaseUrl && supabaseServiceKey ? 'supabase' : !isVercel ? 'local' : 'none';

/**
 * True when albums can be saved. There are no user accounts: each browser gets
 * an anonymous, signed guest id (see lib/server/auth).
 */
export const platformReady = dbMode !== 'none' && storageMode !== 'none';

export const dataDir = env('FULLSTORY_DATA_DIR') ?? `${process.cwd()}/.data`;

export function appUrl(): string {
  const explicit = env('APP_URL', 'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_APP_URL');
  if (explicit) return explicit.replace(/\/$/, '');
  const prod = env('VERCEL_PROJECT_PRODUCTION_URL');
  if (prod && process.env.VERCEL_ENV === 'production') return `https://${prod}`;
  const preview = env('VERCEL_URL');
  if (preview) return `https://${preview}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/** Password for /admin (order management). Admin is disabled when unset. */
export const adminPassword = env('ADMIN_PASSWORD');
