import QRCode from 'qrcode';
import { appUrl } from '@/lib/server/env';
import { getShareByToken } from '@/lib/server/repo/orders';

const COLOR = { dark: '#140d0e', light: '#ffffff' };

/**
 * A QR code that opens the shared album when scanned — for invitations,
 * frames and thank-you cards. PNG by default (?format=svg for print shops),
 * ?download to save it as a file.
 */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const share = await getShareByToken(token);
  if (!share) return new Response('Not found', { status: 404 });
  const target = `${appUrl()}/share/${token}`;
  const sp = new URL(req.url).searchParams;
  const svg = sp.get('format') === 'svg';
  const headers: Record<string, string> = { 'Cache-Control': 'private, max-age=86400' };
  if (sp.has('download')) headers['Content-Disposition'] = `attachment; filename="album-qr-code.${svg ? 'svg' : 'png'}"`;
  if (svg) {
    const body = await QRCode.toString(target, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: COLOR });
    return new Response(body, { headers: { ...headers, 'Content-Type': 'image/svg+xml' } });
  }
  const png = await QRCode.toBuffer(target, { type: 'png', width: 1200, margin: 2, errorCorrectionLevel: 'M', color: COLOR });
  return new Response(new Uint8Array(png), { headers: { ...headers, 'Content-Type': 'image/png' } });
}
