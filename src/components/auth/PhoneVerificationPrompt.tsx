"use client";

import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PhoneVerificationPromptProps {
  /** Display-only — never sent anywhere. Shown so the person knows where the code will go. */
  phone: string;
  onVerify: () => void;
}

/**
 * Shown only right after a signup that included a phone number — see
 * SignupForm. This is a prompt, not the verification workflow itself:
 * the actual send-code/enter-code flow lives at /verify-phone
 * (VerifyPhoneView), a real route rather than something built into this
 * modal, so there's exactly one place that flow's logic lives.
 */
export function PhoneVerificationPrompt({ phone, onVerify }: PhoneVerificationPromptProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-border-default bg-surface-raised p-4 text-left">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-text-brand">
          <PhoneCall size={15} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-900">Verify your phone number</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            We can text a code to <span className="font-medium text-ink-700">{phone}</span>. This is optional.
          </p>
        </div>
      </div>
      <Button type="button" variant="secondary" size="md" onClick={onVerify}>
        Verify phone number
      </Button>
    </div>
  );
}
