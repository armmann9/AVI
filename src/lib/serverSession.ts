/**
 * Cryptographic server session management using Web Crypto API (HMAC-SHA256).
 * Compatible with both Node.js Route Handlers and Edge Runtime Middleware.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const AUTH_SECRET = process.env.AUTH_SECRET || 'bpscvs-production-session-secret-jaipur-2026';
export const SESSION_COOKIE_NAME = 'bpscvs_session';

export interface SessionPayload {
  role: 'admin' | 'photographer';
  name: string;
  email: string;
  exp: number; // Unix timestamp in ms
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSignedToken(payload: SessionPayload): Promise<string> {
  const dataStr = JSON.stringify(payload);
  const dataB64 = bytesToBase64Url(encoder.encode(dataStr));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(signature));
  return `${dataB64}.${sigB64}`;
}

export async function verifySignedToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [dataB64, sigB64] = parts;

  try {
    const key = await getHmacKey();
    const sigBytes = base64UrlToBytes(sigB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      encoder.encode(dataB64)
    );
    if (!isValid) return null;

    const payloadStr = decoder.decode(base64UrlToBytes(dataB64));
    const payload: SessionPayload = JSON.parse(payloadStr);

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
