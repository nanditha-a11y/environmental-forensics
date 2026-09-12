import { apiFetch } from './api';
import type { AuthUser, SignUpInput } from '../types';

const SESSION_KEY = 'efif_session';
const TOKEN_KEY = 'token'; // Aligned with api.ts `localStorage.getItem('token')`

export function getSession(): AuthUser | null {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(user: AuthUser | null, token?: string): void {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function authenticate(
  email: string,
  password: string
): Promise<{ ok: true; user: AuthUser; token?: string } | { ok: false; error: string }> {
  try {
    const data = await apiFetch<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const payload = data.data || data;
    const backendUser = payload.user || payload;

    const user: AuthUser = {
      name: backendUser.full_name || backendUser.name || email.split('@')[0],
      email: backendUser.email || email,
      role: backendUser.role || 'Investigator',
      organization: backendUser.organization || 'EFIF Command Center',
    };

    saveSession(user, payload.token);

    return { ok: true, user, token: payload.token };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Unable to connect to backend server.' };
  }
}

export async function createAccount(
  input: SignUpInput
): Promise<{ ok: true; email: string; user?: AuthUser; token?: string } | { ok: false; error: string }> {
  try {
    const data = await apiFetch<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: input.fullName,
        email: input.email,
        password: input.password,
        role: input.role ? input.role.toLowerCase() : 'investigator',
      }),
    });

    const payload = data.data || data;
    const backendUser = payload.user || payload;

    const user: AuthUser = {
      name: backendUser?.full_name || input.fullName,
      email: backendUser?.email || input.email,
      role: backendUser?.role || input.role || 'Investigator',
      organization: input.organization || 'EFIF Command Center',
    };

    saveSession(user, payload.token);

    return { ok: true, email: user.email, user, token: payload.token };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Unable to connect to backend server.' };
  }
}

export function logout(): void {
  saveSession(null);
}