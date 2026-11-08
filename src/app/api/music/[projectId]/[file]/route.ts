import { MUSIC_TYPES } from '@/lib/server/music';
import { storage } from '@/lib/server/storage';

const TYPE_OF_EXT = Object.fromEntries(Object.entries(MUSIC_TYPES).map(([type, ext]) => [ext, type]));

/**
 * Plays an album's song. Public by design — shared albums play it for
 * visitors — and addressed by an unguessable id. Supports byte ranges, which
 * Safari needs to play audio at all.
 */
export async function GET(req: Request, ctx: { params: Promise<{ projectId: string; file: string }> }) {
  const { projectId, file } = await ctx.params;
  const m = /^[0-9a-f-]{36}\.(mp3|m4a|ogg|wav|flac)$/.exec(file);
  if (!/^[0-9a-f-]{36}$/.test(projectId) || !m) return new Response('Not found', { status: 404 });
  const key = `music/${projectId}/${file}`;
  const store = storage();
  const signed = await store.signedUrl(key, 6 * 3600);
  if (signed) return new Response(null, { status: 302, headers: { Location: signed, 'Cache-Control': 'public, max-age=18000' } });
  const data = await store.get(key);
  if (!data) return new Response('Not found', { status: 404 });
  const type = TYPE_OF_EXT[m[1]];
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (range) {
    const size = data.length;
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    return new Response(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  }
  return new Response(new Uint8Array(data), { headers: { 'Content-Type': type, 'Content-Length': String(data.length), 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
