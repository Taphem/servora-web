"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

export type AuthModalMode = "login" | "signup" | "forgot-password";

interface AuthModalContextValue {
  openLogin: () => void;
  openSignup: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

/** Renders the single shared auth modal at the app root; any component can open it via useAuthModal(). */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthModalMode | null>(null);

  const openLogin = useCallback(() => setMode("login"), []);
  const openSignup = useCallback(() => setMode("signup"), []);
  const close = useCallback(() => setMode(null), []);

  const value = useMemo(() => ({ openLogin, openSignup, close }), [openLogin, openSignup, close]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal mode={mode} onModeChange={setMode} onClose={close} />
    </AuthModalContext.Provider>
  );
}
