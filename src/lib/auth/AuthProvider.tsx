"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSession, logout as apiLogout } from "@/lib/auth/api";
import type { AuthUser } from "@/lib/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Re-checks the session against GET /api/v1/auth/session. */
  refresh: () => Promise<void>;
  /** Adopts a user object the app already has from a register/login response, without an extra round trip. */
  setUser: (user: AuthUser) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const session = await getSession();
      if (session.authenticated) {
        setUserState({
          userId: session.userId,
          email: session.email,
          role: session.role,
          emailVerified: session.emailVerified,
          phoneVerified: session.phoneVerified,
        });
        setStatus("authenticated");
      } else {
        setUserState(null);
        setStatus("unauthenticated");
      }
    } catch {
      // Session check failing (network, gateway down) shouldn't be
      // treated as "logged in" — but it also isn't a confirmed logout,
      // so the UI just shows the signed-out state rather than blocking
      // on an error banner for a background check nobody asked for.
      setUserState(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  const setUser = useCallback((next: AuthUser) => {
    setUserState(next);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUserState(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, refresh, setUser, signOut }),
    [user, status, refresh, setUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
