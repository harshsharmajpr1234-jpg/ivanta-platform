import { NextRequest, NextResponse } from 'next/server';

/**
 * Development proxy: forwards /api/v1/* to the Spring Boot backend so the
 * browser only ever talks to this origin (cookies stay same-site, no CORS).
 * In production the frontend is served behind the same gateway as the API,
 * or NEXT_PUBLIC_API_BASE points at the public API origin directly.
 */
const BACKEND = process.env.BACKEND_ORIGIN ?? 'http://127.0.0.1:8085';

async function proxy(req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  const resolvedParams = await ctx.params;
  const path = resolvedParams?.path ?? [];
  const target = `${BACKEND}/api/v1/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const accept = req.headers.get('accept');
  headers.set('accept', accept ?? 'application/json');

  const init: RequestInit = { method: req.method, headers, cache: 'no-store' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { success: false, code: 'BACKEND_UNAVAILABLE', message: 'The API server is currently initializing or unreachable. Please try again shortly.' },
      { status: 502 },
    );
  }

  const resHeaders = new Headers();
  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  for (const c of setCookies) resHeaders.append('set-cookie', c);
  const upstreamCt = upstream.headers.get('content-type');
  if (upstreamCt) resHeaders.set('content-type', upstreamCt);
  const cd = upstream.headers.get('content-disposition');
  if (cd) resHeaders.set('content-disposition', cd);

  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

export const dynamic = 'force-dynamic';
