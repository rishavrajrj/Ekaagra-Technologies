import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'ekaagra_admin_session';
const SESSION_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'ekaagra-secret-token-key-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ekaagra@2026';

/**
 * Generate a cryptographically signed session token
 */
function createSignature(payload: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

/**
 * Verify administrative credentials and issue a signed session cookie
 */
export async function authenticateAdmin(password: string): Promise<boolean> {
  if (!password || password.trim() === '') return false;

  // Verify against configured ADMIN_PASSWORD
  if (password.trim() !== ADMIN_PASSWORD.trim()) {
    return false;
  }

  const timestamp = Date.now().toString();
  const signature = createSignature(timestamp);
  const token = `${timestamp}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return true;
}

/**
 * Check if the current request possesses a valid, unexpired admin session
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token || !token.includes('.')) return false;

    const [timestampStr, providedSignature] = token.split('.');
    const expectedSignature = createSignature(timestampStr);

    if (providedSignature !== expectedSignature) return false;

    const timestamp = parseInt(timestampStr, 10);
    const maxAgeMs = 1000 * 60 * 60 * 24 * 7; // 7 days

    if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Clear administrative session cookie on logout
 */
export async function logoutAdmin(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Ignore cookie deletion errors
  }
}
