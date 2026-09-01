"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "@/lib/auth/api";
import { getAuthErrorMessage } from "@/lib/auth/errorMessages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Enter your email address.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(undefined);

    setLoading(true);
    try {
      await requestPasswordReset(trimmed);
      // The backend always returns the same message whether or not the
      // account exists (account-enumeration-safe by design) — the UI
      // mirrors that and never implies a definite answer either way.
      setSubmitted(true);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-text-brand">
          <MailCheck size={22} aria-hidden />
        </span>
        <div>
          <p className="font-medium text-ink-900">Check your email</p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            If an account exists for <span className="font-medium text-ink-800">{email.trim()}</span>, we&apos;ve
            sent a link to reset your password.
          </p>
        </div>
        <Button variant="secondary" size="lg" onClick={onBackToLogin} className="mt-2 w-full">
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-text-secondary">
        Enter the email on your account and we&apos;ll send you a link to reset your password.
      </p>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-error-soft bg-error-soft/40 px-3.5 py-3 text-sm text-error"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <Input
        id="forgot-password-email"
        type="email"
        label="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        errorText={emailError}
        disabled={loading}
        placeholder="you@example.com"
      />

      <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full">
        Send reset link
      </Button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="text-center text-sm font-medium text-text-brand hover:underline"
      >
        Back to login
      </button>
    </form>
  );
}
