import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authService from '../lib/auth';
import type { AuthUser, SignUpInput } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (input: SignUpInput) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setUser(authService.getSession());
    setInitializing(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.authenticate(email, password);
    if (result.ok) {
      setUser(result.user);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const result = await authService.createAccount(input);
    if (result.ok) {
      if (result.user) {
        setUser(result.user);
      }
      return { ok: true };
    }
    return { ok: false, error: result.error };
  }, []);

  const signOut = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, signIn, signUp, signOut }),
    [user, initializing, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}