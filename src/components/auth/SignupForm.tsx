"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { register, resendVerificationEmail } from "@/lib/auth/api";
import { getAuthErrorMessage } from "@/lib/auth/errorMessages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 10;

interface SignupFormProps {
  onSwitchToLogin: () => void;
  /** Called when the person is done looking at the post-signup success state (they close the modal). */
  onDone: () => void;
}

export function SignupForm({ onSwitchToLogin, onDone }: SignupFormProps) {
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  function validate() {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "Enter your email address.";
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";

    if (!password) errors.password = "Choose a password.";
    else if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (password && confirmPassword !== password) errors.confirmPassword = "Passwords don't match.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register(email.trim(), password);
      // Registration logs the user in immediately (see src/lib/auth/api.ts)
      // — reflecting that here is accurate, not "pretending" they're
      // verified; emailVerified stays false until they act on the email.
      setUser(user);
      setRegisteredEmail(user.email);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return <SignupSuccess email={registeredEmail} onDone={onDone} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
        id="signup-email"
        type="email"
        label="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        errorText={fieldErrors.email}
        disabled={loading}
        placeholder="you@example.com"
      />

      <PasswordField
        id="signup-password"
        label="Password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        errorText={fieldErrors.password}
        helperText={fieldErrors.password ? undefined : `At least ${PASSWORD_MIN_LENGTH} characters.`}
        disabled={loading}
      />

      <PasswordField
        id="signup-confirm-password"
        label="Confirm password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        errorText={fieldErrors.confirmPassword}
        disabled={loading}
      />

      <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full">
        Create account
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-text-brand hover:underline">
          Log in
        </button>
      </p>
    </form>
  );
}

function SignupSuccess({ email, onDone }: { email: string; onDone: () => void }) {
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleResend() {
    setResendState("sending");
    try {
      await resendVerificationEmail(email);
    } finally {
      // The backend gives an identical response whether or not it
      // actually sent anything (enumeration-safe by design) — so "sent"
      // here means "the request went through", not a delivery guarantee.
      setResendState("sent");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-text-brand">
        <MailCheck size={22} aria-hidden />
      </span>
      <div>
        <p className="font-medium text-ink-900">Check your email</p>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
          We sent a verification link to <span className="font-medium text-ink-800">{email}</span>. Open it to
          verify your account.
        </p>
      </div>

      <Button variant="primary" size="lg" onClick={onDone} className="mt-2 w-full">
        Done
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resendState !== "idle"}
        className="text-xs font-medium text-text-brand hover:underline disabled:pointer-events-none disabled:text-text-tertiary"
      >
        {resendState === "sent" ? "Verification email sent" : resendState === "sending" ? "Sending…" : "Didn't get it? Resend"}
      </button>
    </div>
  );
}
