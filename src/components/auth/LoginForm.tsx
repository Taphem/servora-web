"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthProvider";
import { login } from "@/lib/auth/api";
import { getAuthErrorMessage } from "@/lib/auth/errorMessages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
  onSuccess: () => void;
}

export function LoginForm({ onSwitchToSignup, onSwitchToForgotPassword, onSuccess }: LoginFormProps) {
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "Enter your email address.";
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      setUser(user);
      onSuccess();
      showToast(
        user.emailVerified
          ? "Welcome back."
          : "Logged in — don't forget to verify your email.",
      );
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        <div
          id={errorId}
          role="alert"
          className="flex items-start gap-2 rounded-md border border-error-soft bg-error-soft/40 px-3.5 py-3 text-sm text-error"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}

      <Input
        id="login-email"
        type="email"
        label="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        errorText={fieldErrors.email}
        disabled={loading}
        placeholder="you@example.com"
      />

      <div className="flex flex-col gap-1.5">
        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errorText={fieldErrors.password}
          disabled={loading}
        />
        <button
          type="button"
          onClick={onSwitchToForgotPassword}
          className="self-end text-xs font-medium text-text-brand hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full">
        Log in
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitchToSignup} className="font-medium text-text-brand hover:underline">
          Sign up
        </button>
      </p>
    </form>
  );
}
