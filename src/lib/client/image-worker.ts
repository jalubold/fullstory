/**
 * Off-main-thread photo preparation, in two stages so photos appear fast:
 *
 *  1. preview — decode, then make the screen-size and thumbnail JPEGs. The
 *     photo can be shown and placed as soon as this is done.
 *  2. master — only for HEIC and very large files: a full-size JPEG for the
 *     PDF, made afterwards at low priority (previews always go first).
 *
 * Everything heavy runs in a small pool of Workers. If a worker can't decode a
 * file (HEIC in some Safari workers), the main thread decodes it — one at a
 * time, never dozens at once — and hands the bitmap to the worker to finish.
 */

export interface PreparedImage {
  /** Pixel size of the stored master (after orientation and any downscale). */
  width: number;
  height: number;
  display: Blob;
  thumb: Blob;
  /** True when a JPEG master replaces the original (HEIC, or very large files). */
  reencode: boolean;
  /** The JPEG master, ready later; resolves to null when the original is uploaded as is. */
  master: Promise<Blob | null>;
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
  const { id, kind, file, bitmap: given, size, forceMaster, displayEdge, thumbEdge, masterEdge, masterMaxBytes } = e.data;
  let bitmap = given || null;
  try {
    if (!bitmap) {
      try { bitmap = await decode(file); }
      catch (err) { self.postMessage({ id, ok: false, decodeFailed: true }); return; }
    }
    const W = bitmap.width, H = bitmap.height;
    const reencode = !!forceMaster || Math.max(W, H) > masterEdge || size > masterMaxBytes;
    const [mw, mh] = reencode ? fit(W, H, masterEdge) : [W, H];
    if (kind === 'preview') {
      const [dw, dh] = fit(W, H, displayEdge);
      const dc = draw(bitmap, dw, dh);
      bitmap.close(); bitmap = null;
      const [tw, th] = fit(dw, dh, thumbEdge);
      const tc = draw(dc, tw, th);
      const [display, thumb] = await Promise.all([
        dc.convertToBlob({ type: 'image/jpeg', quality: 0.86 }),
        tc.convertToBlob({ type: 'image/jpeg', quality: 0.8 }),
      ]);
      self.postMessage({ id, ok: true, width: mw, height: mh, reencode, display, thumb });
    } else {
      const master = await draw(bitmap, mw, mh).convertToBlob({ type: 'image/jpeg', quality: 0.9 });
      bitmap.close(); bitmap = null;
      self.postMessage({ id, ok: true, master });
    }
  } catch (err) {
    if (bitmap) bitmap.close();
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
`;

type Kind = 'preview' | 'master';
type PreviewResult = { width: number; height: number; reencode: boolean; display: Blob; thumb: Blob };
type MasterResult = { master: Blob };
type Result = PreviewResult | MasterResult;

interface Job {
  id: number;
  kind: Kind;
  file: File;
  /** Decode on the main thread first (this browser's workers can't read this kind of file). */
  mainDecode: boolean;
  resolve: (r: Result) => void;
  reject: (e: Error) => void;
}

/** Remembered per session: whether workers here can decode HEIC. */
let workerReadsHeic: boolean | null = null;

class WorkerPool {
  private idle: Worker[] = [];
  private previews: Job[] = [];
  private masters: Job[] = [];
  private running = new Map<number, { job: Job; worker: Worker }>();
  private seq = 0;
  broken = false;

  constructor(size: number) {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
    for (let i = 0; i < size; i++) {
      const w = new Worker(url);
      w.onmessage = (e: MessageEvent) => this.done(w, e.data);
      w.onerror = () => {
        // A worker that cannot start (old browser, blocked blob: URLs) — use the main thread from now on.
        this.broken = true;
        const err = new Error('worker-unavailable');
        for (const { job } of this.running.values()) job.reject(err);
        this.running.clear();
        for (const job of [...this.previews.splice(0), ...this.masters.splice(0)]) job.reject(err);
      };
      this.idle.push(w);
    }
  }

  run(file: File, kind: Kind): Promise<Result> {
    return new Promise((resolve, reject) => {
      const job: Job = { id: ++this.seq, kind, file, mainDecode: isHeicFile(file) && workerReadsHeic === false, resolve, reject };
      (kind === 'preview' ? this.previews : this.masters).push(job);
      this.pump();
    });
  }

  private done(w: Worker, data: { id: number; ok: boolean; decodeFailed?: boolean; error?: string } & Partial<PreviewResult & MasterResult>) {
    const entry = this.running.get(data.id);
    this.running.delete(data.id);
    this.idle.push(w);
    if (entry) {
      const { job } = entry;
      if (data.ok) {
        if (isHeicFile(job.file) && !job.mainDecode) workerReadsHeic = true;
        const { id: _id, ok: _ok, ...rest } = data;
        job.resolve(rest as Result);
      } else if (data.decodeFailed && !job.mainDecode) {
        // This browser's workers can't read the file: decode it here, finish it there.
        if (isHeicFile(job.file)) workerReadsHeic = false;
        job.mainDecode = true;
        (job.kind === 'preview' ? this.previews : this.masters).unshift(job);
      } else job.reject(new Error(data.error ?? 'decode failed'));
    }
    this.pump();
  }

  private pump() {
    while (this.idle.length && (this.previews.length || this.masters.length)) {
      // Previews first: every photo should appear before any full-size master is made.
      const job = (this.previews.shift() ?? this.masters.shift())!;
      const w = this.idle.pop()!;
      this.running.set(job.id, { job, worker: w });
      void this.send(w, job);
    }
  }

  private async send(w: Worker, job: Job) {
    const base = { id: job.id, kind: job.kind, size: job.file.size, forceMaster: isHeicFile(job.file), displayEdge: DISPLAY_EDGE, thumbEdge: THUMB_EDGE, masterEdge: MASTER_EDGE, masterMaxBytes: MASTER_MAX_BYTES };
    if (!job.mainDecode) {
      w.postMessage({ ...base, file: job.file });
      return;
    }
    try {
      // At most one decode per worker at a time, so memory stays bounded on phones.
      const bitmap = await decodeAnyhow(job.file);
      w.postMessage({ ...base, file: job.file, bitmap }, [bitmap]);
    } catch (e) {
      this.running.delete(job.id);
      this.idle.push(w);
      job.reject(e instanceof Error ? e : new Error('decode failed'));
      this.pump();
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

/* ------------------------------ main-thread decoding ------------------------------ */

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

const heicCache = new WeakMap<File, Blob>();

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
    // The slow software decoder runs once per photo; the master stage reuses its result.
    let jpeg = heicCache.get(file);
    if (!jpeg) {
      jpeg = await heicToJpeg(file);
      heicCache.set(file, jpeg);
    }
    try {
      return await createImageBitmap(jpeg, { imageOrientation: 'from-image' });
    } catch {
      return decodeWithImg(jpeg);
    }
  }
  throw new Error('undecodable');
}

/** Browsers without worker canvases: same two stages, one photo at a time, yielding between steps. */
let mainChain: Promise<unknown> = Promise.resolve();
function onMainThread<T>(task: () => Promise<T>): Promise<T> {
  const run = mainChain.then(() => new Promise((r) => setTimeout(r, 0))).then(task);
  mainChain = run.catch(() => {});
  return run;
}

async function prepareOnMainThread(file: File): Promise<PreparedImage> {
  const preview = await onMainThread(async () => {
    const bitmap = await decodeAnyhow(file);
    try {
      const W = bitmap.width;
      const H = bitmap.height;
      const reencode = isHeicFile(file) || Math.max(W, H) > MASTER_EDGE || file.size > MASTER_MAX_BYTES;
      const [mw, mh] = reencode ? fit(W, H, MASTER_EDGE) : [W, H];
      const [dw, dh] = fit(W, H, DISPLAY_EDGE);
      const [tw, th] = fit(W, H, THUMB_EDGE);
      const [display, thumb] = await Promise.all([canvasBlob(bitmap, dw, dh, 0.86), canvasBlob(bitmap, tw, th, 0.8)]);
      return { width: mw, height: mh, reencode, display, thumb };
    } finally {
      bitmap.close();
    }
  });
  const master = preview.reencode
    ? onMainThread(async () => {
        const bitmap = await decodeAnyhow(file);
        try {
          return await canvasBlob(bitmap, preview.width, preview.height, 0.9);
        } finally {
          bitmap.close();
        }
      })
    : Promise.resolve(null);
  return { ...preview, master };
}

/** Decodes a photo (respecting EXIF orientation) into a preview now and, when needed, a JPEG master later. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (workersSupported() && !pool?.broken) {
    try {
      pool ??= new WorkerPool(poolSize());
      const p = pool;
      const preview = (await p.run(file, 'preview')) as PreviewResult;
      const master = preview.reencode
        ? p.run(file, 'master').then(
            (r) => (r as MasterResult).master,
            () => prepareOnMainThread(file).then((m) => m.master),
          )
        : Promise.resolve(null);
      return { ...preview, master };
    } catch {
      // The workers couldn't handle this file; the main thread sometimes can.
    }
  }
  return prepareOnMainThread(file);
}
