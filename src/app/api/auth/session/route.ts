import { NextRequest, NextResponse } from 'next/server';
import { verifySignedToken, SESSION_COOKIE_NAME } from '@/lib/serverSession';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifySignedToken(sessionCookie);
    if (!payload) {
      // Invalid or expired token
      const res = NextResponse.json({ user: null });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      user: {
        role: payload.role,
        name: payload.name,
        email: payload.email,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
}
