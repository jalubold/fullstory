import 'server-only';
import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Brings a song in from a link (Google Drive, Dropbox or any direct audio
 * URL) so albums play it from our own storage: Drive and Dropbox links rarely
 * play reliably straight in an <audio> tag (confirmation pages, rate limits,
 * hotlink blocks), and a copy we hold always works.
 */

export const MUSIC_MAX_BYTES = 30 * 1024 * 1024;

export class MusicError extends Error {}

export const MUSIC_TYPES: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/flac': 'flac',
};

const isDriveHost = (h: string) => /(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$|^drive\.usercontent\.google\.com$/.test(h);

function sourceUrl(input: string): { url: URL; drive: boolean } {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    throw new MusicError('That doesn’t look like a link. Paste the full address, starting with https://');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new MusicError('Use a link that starts with https://');
  if (isDriveHost(u.hostname)) {
    if (/\/folders\//.test(u.pathname)) {
      throw new MusicError('That’s a Google Drive folder. Open the song inside it, choose Share → Copy link, and paste that instead.');
    }
    const id = u.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? u.searchParams.get('id');
    if (!id) throw new MusicError('That Google Drive link doesn’t point to a file. Open the song, choose Share → Copy link, and paste that.');
    // The usercontent host with confirm=t skips Drive's "can't scan for viruses" page.
    return { url: new URL(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`), drive: true };
  }
  if (u.hostname.endsWith('dropbox.com')) {
    u.searchParams.delete('dl');
    u.searchParams.set('raw', '1');
  }
  return { url: u, drive: false };
}

function privateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return privateAddress(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

/** Only public internet hosts: never our own network. */
async function assertPublic(u: URL) {
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new MusicError('That link can’t be used.');
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (!addresses.length) throw new MusicError('We couldn’t reach that link. Check it and try again.');
  if (addresses.some((a) => privateAddress(a.address))) throw new MusicError('That link can’t be used.');
}

function sniff(head: Uint8Array, declared: string | null): string | null {
  const s = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (s(0, 3) === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  if (s(0, 4) === 'OggS') return 'audio/ogg';
  if (s(0, 4) === 'fLaC') return 'audio/flac';
  if (s(0, 4) === 'RIFF' && s(8, 12) === 'WAVE') return 'audio/wav';
  if (s(4, 8) === 'ftyp') return 'audio/mp4';
  const t = (declared ?? '').split(';')[0].trim().toLowerCase();
  if (t === 'audio/mp3') return 'audio/mpeg';
  if (t === 'audio/x-m4a' || t === 'audio/aac') return 'audio/mp4';
  return MUSIC_TYPES[t] ? t : null;
}

export async function fetchAudio(input: string): Promise<{ data: Buffer; type: string }> {
  const { url: start, drive } = sourceUrl(input);
  let url = start;
  for (let hop = 0; hop < 6; hop++) {
    await assertPublic(url);
    let res: Response;
    try {
      res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FullstoryMusic/1.0)', Accept: 'audio/*,*/*;q=0.8' }, signal: AbortSignal.timeout(30_000) });
    } catch {
      throw new MusicError('We couldn’t download that link. Check it and try again.');
    }
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    if ([401, 403, 404].includes(res.status)) {
      throw new MusicError(drive ? 'Google Drive won’t share this file. Set its sharing to “Anyone with the link” and try again.' : 'That link isn’t public, or the file is gone.');
    }
    if (!res.ok || !res.body) throw new MusicError(`We couldn’t download that file (error ${res.status}).`);
    const declared = res.headers.get('content-type');
    if (Number(res.headers.get('content-length') || 0) > MUSIC_MAX_BYTES) throw new MusicError('That song is larger than 30 MB. Try a shorter or more compressed MP3.');
    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MUSIC_MAX_BYTES) {
        await reader.cancel().catch(() => {});
        throw new MusicError('That song is larger than 30 MB. Try a shorter or more compressed MP3.');
      }
      chunks.push(value);
    }
    const data = Buffer.concat(chunks);
    const type = sniff(data.subarray(0, 16), declared);
    if (!type) {
      if ((declared ?? '').includes('text/html')) {
        throw new MusicError(drive ? 'Google Drive didn’t hand over the file. Make sure its sharing is set to “Anyone with the link”.' : 'That link opens a web page, not a song. Use a link to the audio file itself.');
      }
      throw new MusicError('That file isn’t a song we can play. Use MP3, M4A, OGG, WAV or FLAC.');
    }
    return { data, type };
  }
  throw new MusicError('That link redirects too many times.');
}
