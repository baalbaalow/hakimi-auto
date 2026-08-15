"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { AmbientGlow } from "@/components/effects/AmbientGlow";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

type AuthMode = "sign-in" | "sign-up";
type MessageTone = "success" | "error" | "info";

export type AuthMessage = {
  text: string;
  tone: MessageTone;
};

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type LoginPageClientProps = {
  initialMessage?: AuthMessage | null;
  initialMode?: AuthMode;
};

const MIN_SIGNUP_PASSWORD_LENGTH = 8;
const genericAuthError = "We couldn't complete that request. Please try again.";

type AuthErrorDetails = {
  name?: string;
  code?: string;
  status?: number;
  message?: string;
};

function logAuthError(context: string, error: AuthErrorDetails) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error(`[auth] ${context}`, {
    name: error.name,
    code: error.code,
    status: error.status,
    message: error.message,
  });
}

function getAuthErrorMessage(error: AuthErrorDetails, mode: AuthMode) {
  const normalized = error.message?.toLowerCase() ?? "";

  if (
    mode === "sign-up" &&
    (normalized.includes("confirmation email") ||
      (error.status === 500 && error.name === "AuthRetryableFetchError"))
  ) {
    return "We couldn't send the confirmation email. Please try again shortly.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (normalized.includes("already registered")) {
    return "An account with this email already exists. Try signing in.";
  }

  if (normalized.includes("password")) {
    return "Please use a stronger password.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (normalized.includes("signup disabled")) {
    return "Signups are not enabled for this project.";
  }

  if (normalized.includes("provider")) {
    return "Google sign-in is not enabled for this Supabase project yet.";
  }

  return genericAuthError;
}

function getAuthCallbackUrl() {
  return new URL("/auth/callback", window.location.origin).toString();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPageClient({
  initialMessage = null,
  initialMode = "sign-in",
}: LoginPageClientProps) {
  const router = useRouter();
  const requestIdRef = useRef(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(initialMessage);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const supabase = useMemo(() => createClient(), []);
  const isSignIn = mode === "sign-in";

  const resetFormForMode = (nextMode: AuthMode) => {
    requestIdRef.current += 1;
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFieldErrors({});
    setMessage(null);
    setLoading(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const validationErrors = validateForm({
      email,
      password,
      confirmPassword,
      mode,
    });

    setFieldErrors(validationErrors);
    setMessage(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (error) {
        logAuthError("signUp failed", error);
        setMessage({
          text: getAuthErrorMessage(error, mode),
          tone: "error",
        });
        setLoading(false);
        return;
      }

      if (data.session) {
        setMessage({
          text: "Signed in successfully.",
          tone: "success",
        });
        router.replace("/dashboard");
        router.refresh();
      } else {
        setMessage({
          text: "Check your email to confirm your account.",
          tone: "success",
        });
      }

      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (error) {
      logAuthError("signInWithPassword failed", error);
      setMessage({
        text: getAuthErrorMessage(error, mode),
        tone: "error",
      });
      setLoading(false);
      return;
    }

    setMessage({
      text: "Signed in successfully.",
      tone: "success",
    });
    router.replace("/dashboard");
    router.refresh();
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    if (loading) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setMessage(null);
    setFieldErrors({});

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (error) {
      logAuthError("signInWithOAuth google failed", error);
      setMessage({
        text: getAuthErrorMessage(error, mode),
        tone: "error",
      });
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <AmbientGlow />
      <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />

      <section className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] border border-white/[0.12] bg-[rgba(11,16,32,0.82)] p-6 shadow-[0_30px_120px_-70px_rgba(34,211,238,0.8)] backdrop-blur-xl sm:p-8">
        <div className="flex justify-center">
          <BrandLogo priority />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">
            Authentication
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {isSignIn ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {isSignIn
              ? "Sign in to manage drafts, connected accounts, and your private library."
              : "Create a Hakimi Auto workspace for private drafts and TikTok account authorization."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-[var(--muted-strong)]">
            Email
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearFieldError("email", setFieldErrors);
                setMessage(null);
              }}
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? (
              <span className="mt-2 block text-sm text-rose-200">
                {fieldErrors.email}
              </span>
            ) : null}
          </label>

          <PasswordField
            label="Password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              clearFieldError("password", setFieldErrors);
              setMessage(null);
            }}
            visible={showPassword}
            onToggleVisible={() => setShowPassword((current) => !current)}
            autoComplete={isSignIn ? "current-password" : "new-password"}
            error={fieldErrors.password}
          />

          {!isSignIn ? (
            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                clearFieldError("confirmPassword", setFieldErrors);
                setMessage(null);
              }}
              visible={showConfirmPassword}
              onToggleVisible={() =>
                setShowConfirmPassword((current) => !current)
              }
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
            />
          ) : (
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="focus-ring rounded-[var(--radius-sm)] text-sm font-medium text-emerald-200 transition hover:text-emerald-100"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Working..."
              : isSignIn
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          <span className="h-px flex-1 bg-white/[0.1]" />
          or
          <span className="h-px flex-1 bg-white/[0.1]" />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={loading}
          onClick={handleGoogleAuth}
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 border-t border-white/[0.08] pt-5 text-sm sm:flex-row">
          <span className="text-[var(--muted)]">
            {isSignIn ? "Need an account?" : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => resetFormForMode(isSignIn ? "sign-up" : "sign-in")}
            className="focus-ring rounded-[var(--radius)] px-3 py-2 font-medium text-emerald-200 transition hover:bg-white/[0.06] hover:text-emerald-100"
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </button>
        </div>

        {message ? (
          <p
            className={`mt-5 rounded-[var(--radius)] border px-3 py-2 text-sm ${
              message.tone === "success"
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                : message.tone === "info"
                  ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                  : "border-rose-300/20 bg-rose-300/10 text-rose-100"
            }`}
            role="status"
          >
            {message.text}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[var(--muted-strong)]">
      {label}
      <span className="relative mt-2 block">
        <Input
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder="Enter your password"
          className="pr-11"
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="focus-ring absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-[var(--foreground)]"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? (
            <EyeOff size={16} aria-hidden="true" />
          ) : (
            <Eye size={16} aria-hidden="true" />
          )}
        </button>
      </span>
      {error ? (
        <span className="mt-2 block text-sm text-rose-200">{error}</span>
      ) : null}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.2z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.7a6 6 0 0 1 0-3.4V7.7H3.1a10 10 0 0 0 0 8.9l3.3-2.9z"
      />
      <path
        fill="#EA4335"
        d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2 10 10 0 0 0 3.1 7.7l3.3 2.6C7.2 7.9 9.4 6.1 12 6.1z"
      />
    </svg>
  );
}

function validateForm({
  email,
  password,
  confirmPassword,
  mode,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  mode: AuthMode;
}) {
  const errors: FieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Enter your email address.";
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  } else if (mode === "sign-up" && password.length < MIN_SIGNUP_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_SIGNUP_PASSWORD_LENGTH} characters.`;
  }

  if (mode === "sign-up") {
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "The password confirmation does not match.";
    }
  }

  return errors;
}

function clearFieldError(
  field: keyof FieldErrors,
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>,
) {
  setFieldErrors((currentErrors) => {
    if (!currentErrors[field]) {
      return currentErrors;
    }

    const nextErrors = { ...currentErrors };
    delete nextErrors[field];
    return nextErrors;
  });
}
