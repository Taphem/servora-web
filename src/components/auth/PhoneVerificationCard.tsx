"use client";

import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, PhoneCall } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/auth/api";
import { getAuthErrorMessage } from "@/lib/auth/errorMessages";
import { ApiError } from "@/lib/auth/client";
import { AuthErrorCode } from "@/lib/auth/types";

type CardState = "idle" | "otp-sent" | "verified" | "no-phone";

interface PhoneVerificationCardProps {
  /** Display-only — never sent anywhere. Shown so the person knows where the code is going. */
  phone?: string;
}

/**
 * Shown only right after a signup that included a phone number — see
 * SignupForm/SignupSuccess. The backend never echoes a `phone` field back
 * on register/login/session (only the boolean `phoneVerified`), so there
 * is no reliable way to know "does this account have a phone on file"
 * from session state alone once this moment has passed. If the request
 * endpoint ever responds PHONE_NOT_SET anyway, this card quietly hides
 * itself rather than showing a confusing error — that response means
 * there's nothing here for this account to verify.
 */
export function PhoneVerificationCard({ phone }: PhoneVerificationCardProps) {
  const { refresh } = useAuth();

  const [state, setState] = useState<CardState>("idle");
  const [otp, setOtp] = useState("");
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const sendingRef = useRef(false);
  const verifyingRef = useRef(false);

  async function handleSendCode() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    setSending(true);
    try {
      const result = await requestPhoneOtp();
      setExpiresInSeconds(result.expiresInSeconds);
      setState("otp-sent");
    } catch (err) {
      if (err instanceof ApiError && err.code === AuthErrorCode.PhoneNotSet) {
        // Nothing to verify — hide the card instead of showing an error.
        setState("no-phone");
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
      // Verifying the phone doesn't return updated user/session fields
      // (see api.ts) — re-check the session so phoneVerified: true is
      // reflected in the shared AuthProvider state, no reload needed.
      await refresh();
      setState("verified");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setVerifying(false);
      verifyingRef.current = false;
    }
  }

  if (state === "no-phone") return null;

  if (state === "verified") {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-lg border border-success-100 bg-success-100/40 px-4 py-3 text-sm text-success-500">
        <CheckCircle2 size={16} className="shrink-0" aria-hidden />
        <span>Phone number verified.</span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-border-default bg-surface-raised p-4 text-left">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-text-brand">
          <PhoneCall size={15} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-900">Verify your phone number</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {phone ? (
              <>
                We&apos;ll send a code to <span className="font-medium text-ink-700">{phone}</span>.
              </>
            ) : (
              "We'll send a code to the phone number on your account."
            )}{" "}
            This is optional.
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-error-soft bg-error-soft/40 px-3 py-2.5 text-xs text-error"
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      {state === "idle" ? (
        <Button type="button" variant="secondary" size="md" loading={sending} onClick={handleSendCode}>
          Send verification code
        </Button>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <Input
            id="phone-otp"
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={verifying}
            placeholder="Enter the code"
            helperText={
              expiresInSeconds ? `Expires in about ${Math.round(expiresInSeconds / 60)} minute(s).` : undefined
            }
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" variant="primary" size="md" loading={verifying} className="flex-1">
              Verify
            </Button>
            <Button type="button" variant="ghost" size="md" loading={sending} onClick={handleSendCode}>
              Resend code
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
