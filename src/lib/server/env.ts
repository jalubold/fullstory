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
export const supabaseAnonKey = env('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY');
export const supabaseServiceKey = env('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY');
export const databaseUrl = env('DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL');
export const storageBucket = env('SUPABASE_STORAGE_BUCKET') ?? 'fullstory';

export type DbMode = 'postgres' | 'pglite' | 'none';
export type AuthMode = 'supabase' | 'local' | 'none';
export type StorageMode = 'supabase' | 'local' | 'none';

export const dbMode: DbMode = databaseUrl ? 'postgres' : !isVercel ? 'pglite' : 'none';
export const authMode: AuthMode =
  supabaseUrl && supabaseAnonKey && env('AUTH_PROVIDER') !== 'local' ? 'supabase' : dbMode !== 'none' ? 'local' : 'none';
export const storageMode: StorageMode = supabaseUrl && supabaseServiceKey ? 'supabase' : !isVercel ? 'local' : 'none';

/** True when accounts, projects and uploads can work. */
export const platformReady = dbMode !== 'none' && authMode !== 'none' && storageMode !== 'none';

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

export const adminEmails = (env('ADMIN_EMAILS') ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function setupIssues(): string[] {
  const issues: string[] = [];
  if (dbMode === 'none') issues.push('No database configured. Connect Supabase (or set DATABASE_URL / POSTGRES_URL).');
  if (storageMode === 'none') issues.push('No file storage configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  if (authMode === 'none') issues.push('No authentication configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  return issues;
}
