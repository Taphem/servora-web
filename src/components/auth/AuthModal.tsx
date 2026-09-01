"use client";

import { Modal } from "@/components/ui/Modal";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { AuthModalMode } from "@/components/auth/AuthModalProvider";

interface AuthModalProps {
  mode: AuthModalMode | null;
  onModeChange: (mode: AuthModalMode) => void;
  onClose: () => void;
}

const titles: Record<AuthModalMode, string> = {
  login: "Log in",
  signup: "Create your account",
  "forgot-password": "Reset your password",
};

export function AuthModal({ mode, onModeChange, onClose }: AuthModalProps) {
  return (
    <Modal open={mode !== null} onClose={onClose} title={mode ? titles[mode] : ""}>
      {mode === "login" ? (
        <LoginForm
          onSwitchToSignup={() => onModeChange("signup")}
          onSwitchToForgotPassword={() => onModeChange("forgot-password")}
          onSuccess={onClose}
        />
      ) : null}
      {mode === "signup" ? (
        <SignupForm onSwitchToLogin={() => onModeChange("login")} onDone={onClose} />
      ) : null}
      {mode === "forgot-password" ? (
        <ForgotPasswordForm onBackToLogin={() => onModeChange("login")} />
      ) : null}
    </Modal>
  );
}
