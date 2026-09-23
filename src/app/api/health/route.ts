import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Lightweight healthcheck endpoint for Supabase keep-alive monitoring.
 * 
 * Public: returns minimal status (ok/error) without internal details.
 * Authenticated (Bearer HEALTH_TOKEN): returns full DB diagnostics.
 */
export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const authHeader = req.headers.get('authorization') || '';
  const healthToken = process.env.HEALTH_TOKEN;

  // Full diagnostic only for authenticated requests
  const isAuthenticated = healthToken && authHeader === `Bearer ${healthToken}`;

  const supabase = getSupabaseClient();
  let dbOk = false;
  let dbError: string | null = null;

  if (supabase) {
    try {
      const { error } = await supabase.from('events').select('id').limit(1);
      dbOk = !error;
      if (error) dbError = error.message;
    } catch {
      dbError = 'unreachable';
    }
  }

  if (isAuthenticated) {
    return NextResponse.json({
      status: dbOk ? 'ok' : 'degraded',
      timestamp,
      db: dbOk ? 'connected' : `error: ${dbError}`,
      version: '1.0.0',
    });
  }

  // Public minimal response — no internals exposed
  return NextResponse.json({
    status: dbOk ? 'ok' : 'degraded',
    timestamp,
  });
}
