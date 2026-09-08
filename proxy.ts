import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'bs_admin';
const ADMIN_SESSION_MESSAGE = 'admin-session-v1';

/**
 * Web Crypto (edge-safe) equivalent of lib/admin-auth.ts's
 * computeSessionToken: HMAC-SHA256(key = ADMIN_PASSWORD, message =
 * 'admin-session-v1'), hex-encoded.
 */
async function computeSessionToken(adminPassword: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(adminPassword),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(ADMIN_SESSION_MESSAGE),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const loginUrl = new URL('/admin/login', request.url);

  if (!adminPassword) {
    return NextResponse.redirect(loginUrl);
  }

  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.redirect(loginUrl);
  }

  const expected = await computeSessionToken(adminPassword);
  if (!timingSafeStringEqual(cookie.value, expected)) {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
