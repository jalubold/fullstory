import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY;

/** Keeps Supabase auth cookies fresh. A no-op when Supabase auth isn't configured. */
export async function proxy(request: NextRequest) {
  if (!url || !key || process.env.AUTH_PROVIDER === 'local') return NextResponse.next();
  if (!request.cookies.getAll().some((c) => c.name.startsWith('sb-'))) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const c of list) request.cookies.set(c.name, c.value);
        response = NextResponse.next({ request });
        for (const c of list) response.cookies.set(c.name, c.value, c.options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|fonts/|icon.svg|favicon.ico|api/payments/webhook|.*\\.(?:png|jpg|jpeg|webp|svg|woff2)$).*)'],
};
