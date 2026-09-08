import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ADMIN_COOKIE_NAME = 'bs_admin';
const ADMIN_SESSION_MESSAGE = 'admin-session-v1';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Computes the expected admin session cookie value: HMAC-SHA256 of a fixed
 * session message, keyed with ADMIN_PASSWORD, hex-encoded.
 */
function computeSessionToken(adminPassword: string): string {
  return createHmac('sha256', adminPassword)
    .update(ADMIN_SESSION_MESSAGE)
    .digest('hex');
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still compare against something of matching length to avoid an
    // early-return timing signal, then report false.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * True if the current request carries a valid admin session cookie.
 * Always false when ADMIN_PASSWORD is not configured.
 */
export async function isAdmin(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return false;
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) {
    return false;
  }

  const expected = computeSessionToken(adminPassword);
  return timingSafeStringEqual(cookie.value, expected);
}

/**
 * Redirects to /admin/login unless the current request is an authenticated
 * admin session. Call at the top of every admin page/server function that
 * requires auth.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect('/admin/login');
  }
}

/**
 * Timing-safe comparison of a submitted password against ADMIN_PASSWORD.
 * False when ADMIN_PASSWORD is not configured.
 */
export function verifyPassword(input: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return false;
  }
  return timingSafeStringEqual(input, adminPassword);
}

/**
 * Sets the admin session cookie. Call after verifyPassword succeeds.
 */
export async function setAdminCookie(): Promise<void> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD is not configured');
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, computeSessionToken(adminPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the admin session cookie.
 */
export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
