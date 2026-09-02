"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { register, resendVerificationEmail } from "@/lib/auth/api";
import { getAuthErrorMessage } from "@/lib/auth/errorMessages";
import { PhoneVerificationPrompt } from "@/components/auth/PhoneVerificationPrompt";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 10;
// Mirrors servora-auth's own register schema exactly (schemas/auth.ts) —
// leading "+", country code, 8-15 digits total. Kept in sync deliberately:
// the backend stays authoritative and can still reject anything this
// accepts, but there's no reason to let the browser round-trip on a
// format the backend would reject anyway.
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

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
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [registeredPhone, setRegisteredPhone] = useState<string | null>(null);
  // Synchronous guard against a second /register call — `loading` alone
  // only disables the button once React re-renders and commits, which
  // leaves a real window (double-click, a held/repeated Enter key, or
  // Enter immediately followed by a click) for a second submit event to
  // reach handleSubmit before that happens. A ref is checked/set in the
  // same tick the handler starts, closing that window regardless of
  // render timing.
  const submittingRef = useRef(false);

  function validate() {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "Enter your email address.";
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";

    if (!password) errors.password = "Choose a password.";
    else if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (password && confirmPassword !== password) errors.confirmPassword = "Passwords don't match.";

    // Phone is optional — only validate a value the user actually typed.
    if (phone.trim() && !E164_PATTERN.test(phone.trim())) {
      errors.phone = "Enter a phone number in international format, e.g. +14155552671.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Ignore a duplicate submit (double-click, key-repeat on Enter, or
    // Enter immediately followed by a click) while one is already in
    // flight — see the comment on submittingRef above.
    if (submittingRef.current) return;

    setFormError(null);
    if (!validate()) return;

    const trimmedPhone = phone.trim();

    submittingRef.current = true;
    setLoading(true);
    try {
      // Omit the argument entirely when there's no phone, all the way
      // from this call site down to the request body (see register() in
      // api.ts) — never pass along an empty/undefined placeholder.
      const user = trimmedPhone
        ? await register(email.trim(), password, trimmedPhone)
        : await register(email.trim(), password);
      // Registration logs the user in immediately (see src/lib/auth/api.ts)
      // — reflecting that here is accurate, not "pretending" they're
      // verified; emailVerified stays false until they act on the email.
      // No separate login() call: the backend already returned a full
      // session on this one request, so calling login() again would just
      // be a second, unnecessary network round trip.
      setUser(user);
      setRegisteredEmail(user.email);
      // The register response never echoes the phone back (see api.ts) —
      // this is the only moment the frontend can know one was given, so
      // it's captured here rather than re-derived from session state later.
      setRegisteredPhone(trimmedPhone || null);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  function handleGoogleSuccess() {
    setFormError(null);
    // Google auth is one action, not "Google signup" — servora-auth
    // resolves-or-creates the account and the response is already a
    // full session (see GoogleAuthButton), so there's no "check your
    // email"/phone-verification intermediate step to show here: the
    // account is either brand new with emailVerified already true
    // (Google's verified email is trusted server-side), or it's an
    // existing account being logged into. Either way, done.
    onDone();
  }

  if (registeredEmail) {
    return <SignupSuccess email={registeredEmail} phone={registeredPhone} onDone={onDone} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-error-soft bg-error-soft/40 px-3.5 py-3 text-sm text-error"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={setFormError} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

        <Input
          id="signup-phone"
          type="tel"
          label="Phone number (optional)"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          errorText={fieldErrors.phone}
          helperText={fieldErrors.phone ? undefined : "International format with country code, e.g. +14155552671."}
          disabled={loading}
          placeholder="+14155552671"
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
    </div>
  );
}

function SignupSuccess({ email, phone, onDone }: { email: string; phone: string | null; onDone: () => void }) {
  const router = useRouter();
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  function handleVerifyPhone() {
    // Close the modal, then hand off to the dedicated /verify-phone route
    // — the actual OTP workflow lives there, not inside this modal.
    onDone();
    router.push("/verify-phone");
  }

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

      {phone ? <PhoneVerificationPrompt phone={phone} onVerify={handleVerifyPhone} /> : null}

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
