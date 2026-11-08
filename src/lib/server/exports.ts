import 'server-only';
import { resizeDocument } from '@/lib/album/build';
import { getCatalog, getSize } from '@/lib/commerce/catalog';
import { renderDigitalPdf, renderPrintCover, renderPrintInterior, type LoadedPhoto } from './pdf/render';
import { getExport, upsertExport, type ExportKind, type OrderRow } from './repo/orders';
import { storage } from './storage';

export const exportKey = (order: OrderRow, kind: ExportKind) => `u/${order.user_id}/orders/${order.id}/${kind}.pdf`;

export function exportFilename(order: OrderRow, kind: ExportKind) {
  const base = (order.document_snapshot.spineText || 'album').replace(/[^\w\s-]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'album';
  return kind === 'digital' ? `${base}-${order.number}.pdf` : `${base}-${order.number}-${kind}.pdf`;
}

function photoLoader(order: OrderRow) {
  const store = storage();
  return async (photoId: string): Promise<LoadedPhoto | null> => {
    const m = order.photo_manifest?.[photoId];
    if (!m) return null;
    const data = await store.get(`${m.storage_prefix}/original.${m.original_ext}`);
    return data ? { data, width: m.width, height: m.height } : null;
  };
}

/**
 * Returns the storage key of an export, rendering it first if needed. The
 * caller is responsible for checking that the order is paid and includes the
 * relevant product.
 */
export async function ensureExport(order: OrderRow, kind: ExportKind): Promise<string> {
  const existing = await getExport(order.id, kind);
  if (existing?.status === 'ready' && existing.storage_key) return existing.storage_key;
  const catalog = getCatalog();
  const title = order.document_snapshot.spineText || 'FULLSTORY album';
  const photo = photoLoader(order);
  await upsertExport(order.id, kind, { status: 'pending' });
  try {
    let bytes: Uint8Array;
    if (kind === 'digital') {
      bytes = await renderDigitalPdf(order.document_snapshot, { title, dpi: catalog.print.digitalDpi, photo });
    } else {
      const print = order.print_options;
      if (!print) throw new Error('Order has no print item');
      const size = getSize(print.sizeId);
      const doc =
        size && (size.widthMm !== order.document_snapshot.size.widthMm || size.heightMm !== order.document_snapshot.size.heightMm)
          ? resizeDocument(order.document_snapshot, { id: size.id, label: size.label, widthMm: size.widthMm, heightMm: size.heightMm })
          : order.document_snapshot;
      if (kind === 'print-interior') {
        bytes = await renderPrintInterior(doc, { title, dpi: catalog.print.targetDpi, photo, bleedMm: catalog.print.bleedMm, pageCount: print.pageCount });
      } else {
        const spineMm = Math.max(catalog.print.spine.minMm, print.pageCount * catalog.print.spine.mmPerPage);
        const wrapMm = print.coverId === 'softcover' ? 0 : catalog.print.spine.coverWrapMm;
        bytes = await renderPrintCover(doc, { title, dpi: catalog.print.targetDpi, photo, bleedMm: catalog.print.bleedMm, spineMm, wrapMm });
      }
    }
    const key = exportKey(order, kind);
    await storage().put(key, Buffer.from(bytes), 'application/pdf');
    await upsertExport(order.id, kind, { status: 'ready', storageKey: key, size: bytes.length });
    return key;
  } catch (e) {
    await upsertExport(order.id, kind, { status: 'failed', error: e instanceof Error ? e.message.slice(0, 500) : 'Export failed' });
    throw e;
  }
}

/** Serves a stored export as a download (signed redirect when supported). */
export async function serveExport(order: OrderRow, kind: ExportKind, key: string): Promise<Response> {
  const name = exportFilename(order, kind);
  const signed = await storage().signedUrl(key, 600, name);
  if (signed) return Response.redirect(signed, 302);
  const data = await storage().get(key);
  if (!data) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Content-Length': String(data.length),
      'Cache-Control': 'private, no-store',
    },
  });
}
