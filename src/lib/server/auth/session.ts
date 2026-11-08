import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { dataDir, isProduction } from '../env';

let secretCache: Buffer | null = null;

/** Secret for signing local session and share-access cookies. */
export function appSecret(): Buffer {
  if (secretCache) return secretCache;
  // Any of these server-only secrets works as key material; SESSION_SECRET is preferred.
  const fromEnv =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (fromEnv) return (secretCache = crypto.createHash('sha256').update(`fullstory:${fromEnv}`).digest());
  if (isProduction && process.env.VERCEL === '1') {
    throw new Error('SESSION_SECRET (or a connected database) is required in production.');
  }
  const file = path.join(dataDir, 'session-secret');
  try {
    secretCache = Buffer.from(fs.readFileSync(file, 'utf8'), 'hex');
  } catch {
    fs.mkdirSync(dataDir, { recursive: true });
    const s = crypto.randomBytes(32);
    fs.writeFileSync(file, s.toString('hex'), { mode: 0o600 });
    secretCache = s;
  }
  return secretCache;
}

const b64 = (b: Buffer) => b.toString('base64url');

export function sign(payload: object): string {
  const body = b64(Buffer.from(JSON.stringify(payload)));
  const mac = b64(crypto.createHmac('sha256', appSecret()).update(body).digest());
  return `${body}.${mac}`;
}

export function verify<T extends { exp?: number }>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = crypto.createHmac('sha256', appSecret()).update(body).digest();
  const given = Buffer.from(mac, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise<Buffer>((res, rej) =>
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? rej(err) : res(key))),
  );
  return `scrypt$16384$8$1$${b64(salt)}$${b64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, N, r, p, salt, hash] = stored.split('$');
  if (algo !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = await new Promise<Buffer>((res, rej) =>
    crypto.scrypt(password, Buffer.from(salt, 'base64url'), expected.length, { N: +N, r: +r, p: +p }, (err, key) => (err ? rej(err) : res(key))),
  );
  return crypto.timingSafeEqual(actual, expected);
}
