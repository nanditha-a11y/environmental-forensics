import type { AuthUser, SignUpInput } from '../types';

/**
 * Mock authentication service for the EFIF prototype.
 *
 * This module is the single seam where a real backend would plug in:
 *   - `authenticate()`      → POST /auth/login
 *   - `createAccount()`     → POST /auth/register
 *   - `getSession()`        → GET /auth/session
 *   - `clearSession()`      → POST /auth/logout
 *
 * There is no server and no database: accounts are simulated and stored in
 * localStorage so a freshly registered user can sign in immediately.
 */

const SESSION_KEY = 'efif_session';
const USERS_KEY = 'efif_users';

export const DEMO_ACCOUNT = {
  email: 'demo@efif.com',
  password: 'demo123',
  user: {
    name: 'Bhargav K.',
    email: 'demo@efif.com',
    role: 'Investigator',
    organization: 'EFIF Command Center',
  } satisfies AuthUser,
};

interface StoredUser extends AuthUser {
  password: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as StoredUser[];
  } catch {
    return [];
  }
}

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: AuthUser | null): void {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export async function authenticate(
  email: string,
  password: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  // Simulated network latency so the loading state is visible.
  await delay(900);

  const normalized = email.trim().toLowerCase();

  if (normalized === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
    return { ok: true, user: DEMO_ACCOUNT.user };
  }

  const match = loadUsers().find(
    (u) => u.email.toLowerCase() === normalized && u.password === password,
  );
  if (match) {
    const { password: _ignored, ...user } = match;
    return { ok: true, user };
  }

  return {
    ok: false,
    error: 'Invalid email or password. Try demo@efif.com with password demo123.',
  };
}

export async function createAccount(
  input: SignUpInput,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  await delay(1100);

  const normalized = input.email.trim().toLowerCase();
  const users = loadUsers();

  if (users.some((u) => u.email.toLowerCase() === normalized)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const stored: StoredUser = {
    name: input.fullName.trim(),
    email: normalized,
    role: input.role,
    organization: input.organization.trim() || 'Independent',
    password: input.password,
  };
  users.push(stored);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { ok: true, email: normalized };
}
