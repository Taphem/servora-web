"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { authenticateWithGoogle } from "@/lib/auth/api";
import { getAuthErrorMessage } from "@/lib/auth/errorMessages";
import { loadGoogleIdentityServices } from "@/lib/auth/googleIdentityServices";
import { env } from "@/lib/env";
import type { AuthUser } from "@/lib/auth/types";
import { Divider } from "@/components/ui/Divider";

type ScriptState = "loading" | "ready" | "unavailable";

interface GoogleAuthButtonProps {
  /** Called once the backend session is live and AuthProvider's state has been updated, with the resolved user. */
  onSuccess: (user: AuthUser) => void;
  /** Called with a user-facing message on any failure — the caller renders it in its own existing error banner. */
  onError: (message: string) => void;
}

/**
 * Renders Google's own official button via Identity Services
 * (google.accounts.id.renderButton) rather than a hand-drawn one — this
 * is the one authentication action, not "Google signup" or "Google
 * login": servora-auth resolves-or-creates the account either way (see
 * api.ts authenticateWithGoogle). Identical component used on both
 * Login and Signup; it has no signup/login mode of its own.
 */
export function GoogleAuthButton({ onSuccess, onError }: GoogleAuthButtonProps) {
  const { setUser } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = useId();
  // Whether a client ID is configured is known synchronously (a module
  // constant) — deriving the initial state from it here means the
  // "unavailable" case never needs a setState call inside the effect below.
  const [scriptState, setScriptState] = useState<ScriptState>(() => (env.googleClientId ? "loading" : "unavailable"));
  // Synchronous guard, same pattern as SignupForm's submittingRef: GIS's
  // button already prevents most double-clicks on its own (it disables
  // itself while its own popup is open), but a stray double invocation
  // of the callback — or a second click during our own in-flight
  // authenticateWithGoogle() call — must still not fire a second request.
  const processingRef = useRef(false);

  useEffect(() => {
    if (!env.googleClientId) return;

    let cancelled = false;

    async function handleCredentialResponse(response: { credential: string }) {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        const user = await authenticateWithGoogle(response.credential);
        // Same mechanism email/password login and signup already use —
        // the response IS a full session, so this adopts it directly
        // rather than making a redundant round trip to GET /session.
        setUser(user);
        onSuccess(user);
      } catch (error) {
        onError(getAuthErrorMessage(error));
      } finally {
        processingRef.current = false;
      }
    }

    loadGoogleIdentityServices()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: env.googleClientId,
          callback: (response) => void handleCredentialResponse(response),
        });
        setScriptState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setScriptState("unavailable");
          onError("Google sign-in isn't available right now. Please use email and password.");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scriptState !== "ready" || !containerRef.current || !window.google) return;
    // renderButton needs a real, empty container each time — clear any
    // previous render before asking Google to draw into it again.
    containerRef.current.innerHTML = "";
    // GIS wants a pixel width, not a percentage — match the modal's
    // actual content width instead of guessing a fixed value.
    const width = containerRef.current.offsetWidth || 320;
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width,
    });
  }, [scriptState]);

  // Hides itself AND the "or" divider together when there's nothing to
  // separate email/password from — never leave a lone divider with no
  // Google option above it, whether that's because no client ID is
  // configured at all or the script failed to load at runtime.
  if (scriptState === "unavailable") return null;

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} id={containerId} className="flex w-full justify-center" />
      <div className="flex items-center gap-3">
        <Divider className="flex-1" />
        <span className="text-xs font-medium text-text-tertiary">or</span>
        <Divider className="flex-1" />
      </div>
    </div>
  );
}
