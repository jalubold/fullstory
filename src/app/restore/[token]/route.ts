import { NextResponse } from 'next/server';
import { restoreFromToken } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/http';

/** Private album link: re-attaches this browser to the albums it belongs to. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const ok = await restoreFromToken(decodeURIComponent(token));
    return NextResponse.redirect(new URL(ok ? '/dashboard?restored=1' : '/dashboard?restore=invalid', req.url));
  } catch (e) {
    return errorResponse(e);
  }
}
