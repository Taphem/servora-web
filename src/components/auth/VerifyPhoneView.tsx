"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Lock, PhoneCall, PhoneOff } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/auth/api";
import { getAuthErrorMessage } from "@/lib/auth/errorMessages";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

type ViewState =
  | "loading"
  | "unauthenticated"
  | "already-verified"
  | "idle"
  | "otp-sent"
  | "verified"
  | "no-phone";

// Purely a client-side anti-spam debounce on the "Resend code" button —
// the backend enforces its own cooldown/rate limit server-side and never
// reports its exact duration in the response, so this number is
// deliberately not presented as authoritative. A genuine RATE_LIMITED
// response from the backend is still handled on its own merits below,
// independent of this timer.
const RESEND_DEBOUNCE_MS = 30_000;

/**
 * Phone number verification, as its own route (not a modal workflow) —
 * this is deliberately reachable on its own, not just from the post-signup
 * moment, matching how /verify-email and /reset-password are also real
 * pages. Requires an existing session (unlike email verification, which
 * is token-based and works for anyone): both OTP endpoints call
 * requireSession() server-side, so this page checks auth status first.
 *
 * SECURITY: the OTP the user types is held only in local component state
 * for the life of this form, sent once per submit, and never logged,
 * stored, or put in a URL — see handleVerify below and client.ts, which
 * never logs request bodies.
 */
export function VerifyPhoneView() {
  const router = useRouter();
  const { openLogin } = useAuthModal();
  const { status, user, refresh } = useAuth();

  const [state, setState] = useState<ViewState>("loading");
  const initializedRef = useRef(false);

  const [otp, setOtp] = useState("");
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const sendingRef = useRef(false);
  const verifyingRef = useRef(false);

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Decide the starting view exactly once, only once real auth state has
  // resolved — never re-derive it afterward, so a mid-flow refresh() (see
  // handleVerify) can't yank the UI back to an earlier state underneath
  // an in-progress action. An already-verified phone short-circuits here
  // before any OTP request is ever possible.
  useEffect(() => {
    if (initializedRef.current || status === "loading") return;
    initializedRef.current = true;
    // Deferred a tick (same pattern as AuthProvider's own mount effect)
    // so the state update isn't flushed synchronously inside the effect.
    queueMicrotask(() => {
      if (status !== "authenticated") {
        setState("unauthenticated");
      } else if (user?.phoneVerified) {
        setState("already-verified");
      } else {
        setState("idle");
      }
    });
  }, [status, user]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(secondsLeft);
      if (secondsLeft <= 0) setCooldownUntil(null);
    };
    queueMicrotask(tick);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  async function handleSendCode() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    setSending(true);
    try {
      const result = await requestPhoneOtp();
      setExpiresInSeconds(result.expiresInSeconds);
      setOtp("");
      setState("otp-sent");
      setCooldownUntil(Date.now() + RESEND_DEBOUNCE_MS);
    } catch (err) {
      if (err instanceof ApiError && err.code === AuthErrorCode.PhoneNotSet) {
        // Nothing to verify — not an error state, just nothing to do here.
        setState("no-phone");
      } else if (err instanceof ApiError && err.code === AuthErrorCode.Unauthenticated) {
        setState("unauthenticated");
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    if (verifyingRef.current) return;
    const trimmed = otp.trim();
    if (!trimmed) {
      setError("Enter the code you received.");
      return;
    }

    verifyingRef.current = true;
    setError(null);
    setVerifying(true);
    try {
      await verifyPhoneOtp(trimmed);
      // Verifying doesn't return updated user/session fields (see
      // api.ts) — re-check the session through the existing auth
      // mechanism so phoneVerified: true is reflected app-wide, no
      // reload needed.
      await refresh();
      setState("verified");
    } catch (err) {
      if (err instanceof ApiError && err.code === AuthErrorCode.Unauthenticated) {
        setState("unauthenticated");
      } else if (
        err instanceof ApiError &&
        (err.code === AuthErrorCode.OtpNotRequested || err.code === AuthErrorCode.OtpAttemptsExceeded)
      ) {
        // This code can't be retried (expired/used/attempts exhausted) —
        // send them back to request a fresh one instead of leaving a
        // dead OTP field open.
        setOtp("");
        setState("idle");
        setError(getAuthErrorMessage(err));
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setVerifying(false);
      verifyingRef.current = false;
    }
  }

  function goToLogin() {
    openLogin();
    router.push("/");
  }

  function goHome() {
    router.push("/");
  }

  return (
    <section className="flex min-h-[60vh] items-center py-20">
      <Container className="mx-auto max-w-md text-center">
        {state === "loading" ? <LoadingState /> : null}
        {state === "unauthenticated" ? <UnauthenticatedState onLogin={goToLogin} /> : null}
        {state === "already-verified" ? <AlreadyVerifiedState onContinue={goHome} /> : null}
        {state === "verified" ? <VerifiedState onContinue={goHome} /> : null}
        {state === "no-phone" ? <NoPhoneState onContinue={goHome} /> : null}
        {state === "idle" ? <IdleState error={error} sending={sending} onSend={handleSendCode} /> : null}
        {state === "otp-sent" ? (
          <OtpState
            otp={otp}
            onOtpChange={setOtp}
            error={error}
            verifying={verifying}
            sending={sending}
            expiresInSeconds={expiresInSeconds}
            cooldownRemaining={cooldownRemaining}
            onSubmit={handleVerify}
            onResend={handleSendCode}
          />
        ) : null}
      </Container>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner size={28} className="text-text-brand" />
      <p className="text-sm text-text-secondary">Loading…</p>
    </div>
  );
}

function UnauthenticatedState({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-100 text-warning-500">
        <Lock size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Log in to verify your phone</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        You need to be signed in to Servora to verify a phone number.
      </p>
      <Button variant="primary" size="lg" onClick={onLogin} className="mt-2">
        Log in
      </Button>
    </div>
  );
}

function AlreadyVerifiedState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-500">
        <CheckCircle2 size={28} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Phone number verified</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        Your phone number on file is already verified — there&apos;s nothing else to do here.
      </p>
      <Button variant="primary" size="lg" onClick={onContinue} className="mt-2">
        Continue to Servora
      </Button>
    </div>
  );
}

function VerifiedState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-500">
        <CheckCircle2 size={28} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Phone number verified</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        You&apos;re all set — your phone number is now verified.
      </p>
      <Button variant="primary" size="lg" onClick={onContinue} className="mt-2">
        Continue to Servora
      </Button>
    </div>
  );
}

function NoPhoneState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-50 text-ink-500">
        <PhoneOff size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">No phone number on file</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        Your account doesn&apos;t have a phone number to verify. Phone numbers are optional on Servora.
      </p>
      <Button variant="secondary" size="lg" onClick={onContinue} className="mt-2">
        Continue to Servora
      </Button>
    </div>
  );
}

function IdleState({
  error,
  sending,
  onSend,
}: {
  error: string | null;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-text-brand">
        <PhoneCall size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Verify your phone number</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        We&apos;ll text a verification code to the phone number on your account. This is optional — you can keep
        using Servora without verifying it.
      </p>

      {error ? (
        <div
          role="alert"
          className="flex w-full items-start gap-2 rounded-md border border-error-soft bg-error-soft/40 px-3.5 py-3 text-sm text-error"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <Button variant="primary" size="lg" loading={sending} onClick={onSend} className="mt-2 w-full">
        Send verification code
      </Button>
    </div>
  );
}

function OtpState({
  otp,
  onOtpChange,
  error,
  verifying,
  sending,
  expiresInSeconds,
  cooldownRemaining,
  onSubmit,
  onResend,
}: {
  otp: string;
  onOtpChange: (value: string) => void;
  error: string | null;
  verifying: boolean;
  sending: boolean;
  expiresInSeconds: number | null;
  cooldownRemaining: number;
  onSubmit: (event: FormEvent) => void;
  onResend: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-text-brand">
        <PhoneCall size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Enter your code</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        We sent a verification code by text to the phone number on your account.
      </p>

      <form onSubmit={onSubmit} className="flex w-full flex-col gap-4 text-left">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-error-soft bg-error-soft/40 px-3.5 py-3 text-sm text-error"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <Input
          id="phone-otp"
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          value={otp}
          onChange={(e) => onOtpChange(e.target.value)}
          disabled={verifying}
          placeholder="Enter the code"
          helperText={
            expiresInSeconds ? `Expires in about ${Math.round(expiresInSeconds / 60)} minute(s).` : undefined
          }
        />

        <Button type="submit" variant="primary" size="lg" loading={verifying} className="w-full">
          Verify
        </Button>

        <button
          type="button"
          onClick={onResend}
          disabled={sending || cooldownRemaining > 0}
          className="text-center text-sm font-medium text-text-brand hover:underline disabled:pointer-events-none disabled:text-text-tertiary"
        >
          {cooldownRemaining > 0 ? `Resend code in ${cooldownRemaining}s` : "Resend code"}
        </button>
      </form>
    </div>
  );
}
