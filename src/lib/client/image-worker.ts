/**
 * Off-main-thread photo preparation. Decoding and resizing a 12–48 MP phone
 * photo takes hundreds of milliseconds; doing it in a Worker keeps scrolling,
 * tapping and the live album preview smooth while dozens of photos are added.
 *
 * The worker is created from an inline source (no bundler wiring needed) and
 * falls back to the main thread where Workers or OffscreenCanvas are missing.
 */

export interface PreparedImage {
  /** Pixel size of the stored master (after orientation and any downscale). */
  width: number;
  height: number;
  display: Blob;
  thumb: Blob;
  /** Re-encoded master when the original is very large or HEIC; null means "upload the original file as is". */
  master: Blob | null;
}

const isHeicFile = (f: File) => /hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

export const DISPLAY_EDGE = 1600;
export const THUMB_EDGE = 480;
/** Long edge for the stored master: comfortably sharp for a full-bleed page in the PDF. */
export const MASTER_EDGE = 4096;
/** Originals larger than this are re-encoded even when within MASTER_EDGE. */
export const MASTER_MAX_BYTES = 9 * 1024 * 1024;

const WORKER_SOURCE = `
const fit = (w, h, edge) => { const s = Math.min(1, edge / Math.max(w, h)); return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))]; };
const draw = (src, w, h) => {
  const c = new OffscreenCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  return c;
};
async function decode(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) { return await createImageBitmap(file); }
}
self.onmessage = async (e) => {
  const { id, file, displayEdge, thumbEdge, masterEdge, masterMaxBytes, forceMaster } = e.data;
  let bitmap;
  try {
    bitmap = await decode(file);
    const W = bitmap.width, H = bitmap.height;
    const [dw, dh] = fit(W, H, displayEdge);
    const dc = draw(bitmap, dw, dh);
    const [tw, th] = fit(dw, dh, thumbEdge);
    const tc = draw(dc, tw, th);
    let master = null, mw = W, mh = H;
    if (forceMaster || Math.max(W, H) > masterEdge || file.size > masterMaxBytes) {
      [mw, mh] = fit(W, H, masterEdge);
      master = await draw(bitmap, mw, mh).convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    }
    bitmap.close();
    bitmap = null;
    const [display, thumb] = await Promise.all([
      dc.convertToBlob({ type: 'image/jpeg', quality: 0.86 }),
      tc.convertToBlob({ type: 'image/jpeg', quality: 0.8 }),
    ]);
    self.postMessage({ id, ok: true, width: mw, height: mh, display, thumb, master });
  } catch (err) {
    if (bitmap) bitmap.close();
    self.postMessage({ id, ok: false, error: String(err && err.message || err) });
  }
};
`;

type Job = { resolve: (r: PreparedImage) => void; reject: (e: Error) => void };

class WorkerPool {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Array<{ id: number; file: File; job: Job }> = [];
  private jobs = new Map<number, Job>();
  private seq = 0;
  broken = false;

  constructor(size: number) {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
    for (let i = 0; i < size; i++) {
      const w = new Worker(url);
      w.onmessage = (e: MessageEvent) => {
        const { id, ok, error, ...rest } = e.data as { id: number; ok: boolean; error?: string } & PreparedImage;
        const job = this.jobs.get(id);
        this.jobs.delete(id);
        if (job) (ok ? job.resolve(rest as PreparedImage) : job.reject(new Error(error)));
        this.idle.push(w);
        this.pump();
      };
      w.onerror = () => {
        // A worker that cannot start (old browser, blocked blob: URLs) — use the main thread from now on.
        this.broken = true;
        for (const [, job] of this.jobs) job.reject(new Error('worker-unavailable'));
        this.jobs.clear();
        for (const q of this.queue.splice(0)) q.job.reject(new Error('worker-unavailable'));
      };
      this.workers.push(w);
      this.idle.push(w);
    }
  }

  run(file: File): Promise<PreparedImage> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id: ++this.seq, file, job: { resolve, reject } });
      this.pump();
    });
  }

  private pump() {
    while (this.idle.length && this.queue.length) {
      const w = this.idle.pop()!;
      const { id, file, job } = this.queue.shift()!;
      this.jobs.set(id, job);
      w.postMessage({ id, file, displayEdge: DISPLAY_EDGE, thumbEdge: THUMB_EDGE, masterEdge: MASTER_EDGE, masterMaxBytes: MASTER_MAX_BYTES, forceMaster: isHeicFile(file) });
    }
  }
}

let pool: WorkerPool | null = null;

function workersSupported() {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined';
}

function poolSize() {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (mem && mem <= 2) return 1;
  return Math.max(1, Math.min(2, (navigator.hardwareConcurrency || 2) - 1));
}

/* ------------------------------ main-thread fallback ------------------------------ */

function fit(w: number, h: number, edge: number) {
  const s = Math.min(1, edge / Math.max(w, h));
  return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))] as const;
}

function canvasBlob(src: CanvasImageSource, w: number, h: number, quality: number): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/jpeg', quality));
}

async function decodeWithImg(blob: Blob): Promise<ImageBitmap> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Heic2Any = (o: { blob: Blob; toType?: string; quality?: number }) => Promise<Blob | Blob[]>;
let heicLib: Promise<Heic2Any> | null = null;
const HEIC_DECODER_FILE = 'heic2any-0.0.4.min.js';

/**
 * Last resort for HEIC where the browser can't read it (older iOS, desktop
 * Chrome): a decoder fetched as a static file only when needed, so it never
 * weighs on the app bundle.
 */
function loadHeic2Any(): Promise<Heic2Any> {
  heicLib ??= new Promise<Heic2Any>((resolve, reject) => {
    const s = document.createElement('script');
    // Built at runtime so bundlers don't try to treat the static file as a module.
    s.src = ['', 'vendor', HEIC_DECODER_FILE].join('/');
    s.async = true;
    s.onload = () => {
      const fn = (window as unknown as { heic2any?: Heic2Any }).heic2any;
      if (fn) resolve(fn);
      else reject(new Error('heic decoder missing'));
    };
    s.onerror = () => {
      heicLib = null;
      reject(new Error('heic decoder failed to load'));
    };
    document.head.appendChild(s);
  });
  return heicLib;
}

async function heicToJpeg(file: File): Promise<Blob> {
  const heic2any = await loadHeic2Any();
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  return Array.isArray(out) ? out[0] : out;
}

async function decodeAnyhow(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {}
  try {
    return await createImageBitmap(file);
  } catch {}
  try {
    return await decodeWithImg(file);
  } catch {}
  if (isHeicFile(file)) {
    const jpeg = await heicToJpeg(file);
    try {
      return await createImageBitmap(jpeg, { imageOrientation: 'from-image' });
    } catch {
      return decodeWithImg(jpeg);
    }
  }
  throw new Error('undecodable');
}

async function prepareOnMainThread(file: File): Promise<PreparedImage> {
  const bitmap = await decodeAnyhow(file);
  try {
    const W = bitmap.width;
    const H = bitmap.height;
    const [dw, dh] = fit(W, H, DISPLAY_EDGE);
    const [tw, th] = fit(W, H, THUMB_EDGE);
    // HEIC always gets a JPEG master: the PDF and every browser can read it.
    const big = isHeicFile(file) || Math.max(W, H) > MASTER_EDGE || file.size > MASTER_MAX_BYTES;
    const [mw, mh] = big ? fit(W, H, MASTER_EDGE) : [W, H];
    const [display, thumb, master] = await Promise.all([
      canvasBlob(bitmap, dw, dh, 0.86),
      canvasBlob(bitmap, tw, th, 0.8),
      big ? canvasBlob(bitmap, mw, mh, 0.9) : Promise.resolve(null),
    ]);
    return { width: mw, height: mh, display, thumb, master };
  } finally {
    bitmap.close();
  }
}

/** Decodes a photo (respecting EXIF orientation) and makes the display, thumbnail and — for huge files — master JPEGs. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (workersSupported() && !pool?.broken) {
    try {
      pool ??= new WorkerPool(poolSize());
      return await pool.run(file);
    } catch {
      // The worker couldn't start or decode this file; the main thread sometimes can.
    }
  }
  return prepareOnMainThread(file);
}
