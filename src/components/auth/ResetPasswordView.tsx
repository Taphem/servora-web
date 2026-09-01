"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, KeyRound } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/auth/PasswordField";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { confirmPasswordReset } from "@/lib/auth/api";
import { getAuthErrorMessage } from "@/lib/auth/errorMessages";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

const PASSWORD_MIN_LENGTH = 10;

type ViewState = "form" | "missing" | "invalid" | "success";

/**
 * SECURITY: same handling as /verify-email — the reset token is read
 * once from the URL, stripped from the address bar via
 * `history.replaceState` before anything else happens, and held only in
 * a ref for the lifetime of this component (never localStorage/
 * sessionStorage, never logged).
 */
export function ResetPasswordView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openLogin } = useAuthModal();

  const tokenRef = useRef<string | null>(null);
  const cleaned = useRef(false);
  // Derived once from the initial URL, so the "missing" case doesn't
  // need a setState call inside the effect below.
  const [view, setView] = useState<ViewState>(() => (searchParams.get("token") ? "form" : "missing"));

  useEffect(() => {
    if (cleaned.current) return;
    cleaned.current = true;

    const token = searchParams.get("token");
    window.history.replaceState(null, "", "/reset-password");

    if (!token) return;
    tokenRef.current = token;
  }, [searchParams]);

  function goToLogin() {
    openLogin();
    router.push("/");
  }

  return (
    <section className="flex min-h-[60vh] items-center py-20">
      <Container className="mx-auto max-w-md text-center">
        {view === "missing" ? <MissingTokenState onContinue={goToLogin} /> : null}
        {view === "invalid" ? <InvalidTokenState onContinue={goToLogin} /> : null}
        {view === "success" ? <SuccessState onContinue={goToLogin} /> : null}
        {view === "form" ? (
          <ResetForm
            getToken={() => tokenRef.current}
            onInvalidToken={() => setView("invalid")}
            onSuccess={() => setView("success")}
          />
        ) : null}
      </Container>
    </section>
  );
}

function ResetForm({
  getToken,
  onInvalidToken,
  onSuccess,
}: {
  getToken: () => string | null;
  onInvalidToken: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors: typeof fieldErrors = {};
    if (!password) errors.password = "Choose a new password.";
    else if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (password && confirmPassword !== password) errors.confirmPassword = "Passwords don't match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const token = getToken();
    if (!token) {
      onInvalidToken();
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      // Resetting revokes every existing session for this account — the
      // caller is not left logged in, so success routes to login, not home.
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError && error.code === AuthErrorCode.TokenInvalid) {
        onInvalidToken();
      } else {
        setFormError(getAuthErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-text-brand">
        <KeyRound size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Set a new password</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-2 flex w-full flex-col gap-4 text-left">
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-error-soft bg-error-soft/40 px-3.5 py-3 text-sm text-error"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <PasswordField
          id="reset-password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errorText={fieldErrors.password}
          helperText={fieldErrors.password ? undefined : `At least ${PASSWORD_MIN_LENGTH} characters.`}
          disabled={loading}
        />

        <PasswordField
          id="reset-confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          errorText={fieldErrors.confirmPassword}
          disabled={loading}
        />

        <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full">
          Reset password
        </Button>
      </form>
    </div>
  );
}

function MissingTokenState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-100 text-warning-500">
        <AlertCircle size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">No reset link found</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        This page is meant to be opened from the link in your password reset email.
      </p>
      <Button variant="secondary" size="lg" onClick={onContinue} className="mt-2">
        Back to login
      </Button>
    </div>
  );
}

function InvalidTokenState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error-soft text-error">
        <XCircle size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">This link is invalid or has expired</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        Password reset links stop working after they&apos;re used once or after a while. Request a new one from the
        login screen.
      </p>
      <Button variant="secondary" size="lg" onClick={onContinue} className="mt-2">
        Back to login
      </Button>
    </div>
  );
}

function SuccessState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-500">
        <CheckCircle2 size={28} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Password reset</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        Your password has been changed and you&apos;ve been signed out everywhere for security. Log in with your new
        password to continue.
      </p>
      <Button variant="primary" size="lg" onClick={onContinue} className="mt-2">
        Continue to login
      </Button>
    </div>
  );
}
