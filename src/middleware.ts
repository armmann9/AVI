import { NextRequest, NextResponse } from 'next/server';
import { verifySignedToken, SESSION_COOKIE_NAME } from '@/lib/serverSession';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin routes (including /admin and /admin/*)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySignedToken(token);

    if (!session || session.role !== 'admin') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /studio routes (including /studio and /studio/*)
  if (pathname === '/studio' || pathname.startsWith('/studio/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySignedToken(token);

    if (!session || session.role !== 'photographer') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/studio', '/studio/:path*'],
};
