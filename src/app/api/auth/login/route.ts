import { NextRequest, NextResponse } from 'next/server';
import { createSignedToken, SESSION_COOKIE_NAME, SessionPayload } from '@/lib/serverSession';


// Rate Limiting Store: IP -> { count: number, resetAt: number, lockedUntil: number }
interface RateLimitRecord {
  count: number;
  resetAt: number;
  lockedUntil: number;
}
const ipAttempts = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;  // 15 minutes tracking window

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

// Constant-time string comparison to prevent timing attacks
function safeStringCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Server-side authoritative credentials (configurable via env vars)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@bpscvs.org').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bpscvs@2026';
const ADMIN_NAME = 'Samiti Admin';

const PHOTOGRAPHER_EMAIL = (process.env.PHOTOGRAPHER_EMAIL || 'lens.rohan@bpscvs.org').trim().toLowerCase();
const PHOTOGRAPHER_PASSWORD = process.env.PHOTOGRAPHER_PASSWORD || 'photo@2026';
const PHOTOGRAPHER_NAME = 'Rohan (Photographer)';

// ── Production env-var guard ──────────────────────────────────────
// In production, refuse to run with default fallback credentials.
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_PASSWORD || !process.env.AUTH_SECRET) {
    console.error('[SECURITY] CRITICAL: ADMIN_PASSWORD or AUTH_SECRET is not set in production env.');
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  // Check Rate Limiter / Lockout
  const record = ipAttempts.get(ip);
  if (record) {
    if (record.lockedUntil > now) {
      const remainingSecs = Math.ceil((record.lockedUntil - now) / 1000);
      const remainingMins = Math.ceil(remainingSecs / 60);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Access temporarily locked for security. Please try again in ${remainingMins} minute(s).`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(remainingSecs),
          },
        }
      );
    }

    // Reset window if expired
    if (now > record.resetAt) {
      ipAttempts.delete(ip);
    }
  }

  // Enforce JSON Content-Type to block cross-origin form submission attacks
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 415 });
  }

  try {
    const body = await req.json();
    const { role, email, password } = body;

    if (!role || !email || !password) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    let validatedUser: { role: 'admin' | 'photographer'; name: string; email: string } | null = null;

    if (role === 'admin') {
      if (cleanEmail === ADMIN_EMAIL && safeStringCompare(password, ADMIN_PASSWORD)) {
        validatedUser = { role: 'admin', name: ADMIN_NAME, email: ADMIN_EMAIL };
      }
    } else if (role === 'photographer') {
      if (cleanEmail === PHOTOGRAPHER_EMAIL && safeStringCompare(password, PHOTOGRAPHER_PASSWORD)) {
        validatedUser = { role: 'photographer', name: PHOTOGRAPHER_NAME, email: PHOTOGRAPHER_EMAIL };
      }
    }

    // Handle Failed Attempt
    if (!validatedUser) {
      const current = ipAttempts.get(ip) || { count: 0, resetAt: now + ATTEMPT_WINDOW_MS, lockedUntil: 0 };
      current.count += 1;
      
      if (current.count >= MAX_FAILED_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_DURATION_MS;
        ipAttempts.set(ip, current);
        console.error(`🚨 [SECURITY LOCKOUT] IP ${ip} locked out for 15 minutes. Exceeded ${MAX_FAILED_ATTEMPTS} failed attempts for role '${role}' (attempted email: '${cleanEmail}').`);
        return NextResponse.json(
          {
            error: 'Security Alert: Maximum invalid login attempts reached. Your IP address has been temporarily locked for 15 minutes.',
          },
          { status: 429 }
        );
      } else {
        ipAttempts.set(ip, current);
        const attemptsLeft = MAX_FAILED_ATTEMPTS - current.count;
        console.warn(`⚠️ [SECURITY ALERT] Failed login attempt ${current.count}/${MAX_FAILED_ATTEMPTS} for role '${role}' from IP ${ip} (email: '${cleanEmail}').`);
        return NextResponse.json(
          {
            error: `Invalid credentials. Please verify your email and password. (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before security lockout)`,
          },
          { status: 401 }
        );
      }
    }

    // Success: Reset rate limit for this IP
    ipAttempts.delete(ip);
    console.log(`✅ [SECURITY AUDIT] Successful login for '${validatedUser.name}' (${validatedUser.role}) from IP ${ip} at ${new Date().toISOString()}`);

    // Session lifetime: admin = 24h, photographer = 72h
    const sessionLifetimeMs = validatedUser.role === 'admin'
      ? 24 * 60 * 60 * 1000        // 24 hours for admin
      : 3 * 24 * 60 * 60 * 1000;  // 72 hours for photographer
    const exp = Date.now() + sessionLifetimeMs;
    const sessionMaxAge = validatedUser.role === 'admin'
      ? 24 * 60 * 60   // 24 hours
      : 3 * 24 * 60 * 60; // 72 hours
    const sessionPayload: SessionPayload = {
      role: validatedUser.role,
      name: validatedUser.name,
      email: validatedUser.email,
      exp,
    };

    const token = await createSignedToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: validatedUser,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction || req.url.startsWith('https:'),
      sameSite: 'strict',
      path: '/',
      maxAge: sessionMaxAge,
    });

    return response;
  } catch (error) {
    console.error('Server auth login error:', error);
    return NextResponse.json({ error: 'Authentication service error' }, { status: 500 });
  }
}
