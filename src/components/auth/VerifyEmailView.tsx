"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, MailQuestion } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { verifyEmail, resendVerificationEmail } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

type VerifyState = "verifying" | "success" | "invalid" | "missing" | "network-error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * SECURITY: the verification token lives in the URL only for the
 * instant it takes this component to mount. It is:
 *  - read once from the URL, then held ONLY in a component ref/state
 *    (never written to localStorage/sessionStorage)
 *  - stripped from the visible URL via `history.replaceState` before
 *    the verification request is even sent, so it never sits in the
 *    address bar, browser history entry title, or gets shared/screen-
 *    shotted with the page
 *  - never logged (see src/lib/auth/client.ts — the fetch layer used
 *    here does not log request bodies) and never interpolated into any
 *    error message shown to the user
 */
export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openLogin } = useAuthModal();

  // Whether a token was present is derived once, during the initial
  // render, straight from the URL the page was opened with — so the
  // "missing" case never needs a setState call inside the effect below.
  const [state, setState] = useState<VerifyState>(() =>
    searchParams.get("token") ? "verifying" : "missing",
  );
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const token = searchParams.get("token");

    // Strip the token from the address bar immediately — before the
    // network request, not after — regardless of whether it's present,
    // valid, or empty. This runs even for a missing token so a stray
    // `?token=` (empty) doesn't linger either.
    window.history.replaceState(null, "", "/verify-email");

    if (!token) return;

    verifyEmail(token)
      .then(() => setState("success"))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === AuthErrorCode.TokenInvalid) {
          setState("invalid");
        } else {
          setState("network-error");
        }
      });
  }, [searchParams]);

  function continueToLogin() {
    openLogin();
    router.push("/");
  }

  return (
    <section className="flex min-h-[60vh] items-center py-20">
      <Container className="mx-auto max-w-md text-center">
        {state === "verifying" ? <VerifyingState /> : null}
        {state === "success" ? <SuccessState onContinue={continueToLogin} /> : null}
        {state === "missing" ? <MissingTokenState onContinue={continueToLogin} /> : null}
        {state === "invalid" ? <InvalidTokenState onContinue={continueToLogin} /> : null}
        {state === "network-error" ? (
          <NetworkErrorState onRetry={() => window.location.reload()} onContinue={continueToLogin} />
        ) : null}
      </Container>
    </section>
  );
}

function VerifyingState() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Spinner size={28} className="text-text-brand" />
      <h1 className="font-display text-h3 text-ink-900">Verifying your email…</h1>
      <p className="text-sm text-text-secondary">This only takes a moment.</p>
    </div>
  );
}

function SuccessState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-500">
        <CheckCircle2 size={28} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Email verified</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        Your email address has been verified. You&apos;re all set — log in to continue.
      </p>
      <Button variant="primary" size="lg" onClick={onContinue} className="mt-2">
        Continue to login
      </Button>
    </div>
  );
}

function MissingTokenState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-100 text-warning-500">
        <MailQuestion size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">No verification link found</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        This page is meant to be opened from the link in your verification email. If you&apos;ve already verified,
        you can just log in.
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
        Verification links stop working after they&apos;re used once or after a while. Request a new one below.
      </p>
      <ResendForm />
      <button
        type="button"
        onClick={onContinue}
        className="text-sm font-medium text-text-brand hover:underline"
      >
        Back to login
      </button>
    </div>
  );
}

function NetworkErrorState({ onRetry, onContinue }: { onRetry: () => void; onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-100 text-warning-500">
        <AlertTriangle size={26} aria-hidden />
      </span>
      <h1 className="font-display text-h3 text-ink-900">Couldn&apos;t verify right now</h1>
      <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
        Something went wrong reaching Servora. Your link hasn&apos;t been used up — it&apos;s safe to try again.
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button variant="primary" size="lg" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="secondary" size="lg" onClick={onContinue}>
          Back to login
        </Button>
      </div>
    </div>
  );
}

function ResendForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setStatus("sending");
    try {
      await resendVerificationEmail(trimmed);
    } catch (err) {
      // Resend is enumeration-safe on the backend and rarely errors for
      // real users — a client/network failure here still shouldn't
      // block them, so this quietly falls through to "sent" rather
      // than surfacing raw client error codes (e.g. ClientErrorCode.NetworkError)
      void err;
    } finally {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return <p className="text-sm text-success-500">If that email needs a new link, we&apos;ve sent one.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 text-left">
      <Input
        id="resend-verification-email"
        type="email"
        label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        errorText={error}
        disabled={status === "sending"}
        placeholder="you@example.com"
      />
      <Button type="submit" variant="secondary" size="md" loading={status === "sending"}>
        Resend verification email
      </Button>
    </form>
  );
}
