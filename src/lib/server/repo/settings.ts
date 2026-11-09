import 'server-only';
import { sqlOne, sql } from '../db';

/** Small server-side key/value store (e.g. payment provider product IDs). Never exposed to the browser. */
export async function getSetting(key: string): Promise<string | null> {
  return (await sqlOne<{ value: string }>('select value from app_settings where key = $1', [key]))?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await sql('insert into app_settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value, updated_at = now()', [key, value]);
}
