"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AmbientGlow } from "@/components/effects/AmbientGlow";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createClient,
  getSupabaseConfigError,
} from "@/utils/supabase/client";

type LoginPageClientProps = {
  initialMessage?: string | null;
  supabaseConfigError?: string | null;
};

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

function getAuthErrorMessage(error: AuthErrorDetails, mode: "sign-in" | "sign-up") {
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

  if (
    normalized.includes("invalid api key") ||
    normalized.includes("project not found") ||
    normalized.includes("failed to fetch")
  ) {
    return "Supabase authentication is not configured correctly for this deployment.";
  }

  return genericAuthError;
}

function getAppOrigin() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const currentOrigin = window.location.origin;
  const isLocalOrigin =
    currentOrigin.startsWith("http://localhost") ||
    currentOrigin.startsWith("http://127.0.0.1");

  return isLocalOrigin ? currentOrigin : configuredAppUrl || currentOrigin;
}

function getAuthCallbackUrl() {
  return new URL("/auth/callback", getAppOrigin()).toString();
}

function isSuccessMessage(message: string) {
  return message.startsWith("Signed in") || message.startsWith("Check your email");
}

export default function LoginPageClient({
  initialMessage = null,
  supabaseConfigError = null,
}: LoginPageClientProps) {
  const router = useRouter();
  const configError = supabaseConfigError ?? getSupabaseConfigError();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const supabase = useMemo(
    () => (configError ? null : createClient()),
    [configError],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!supabase) {
      setMessage(configError ?? genericAuthError);
      setLoading(false);
      return;
    }

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) {
        logAuthError("signUp failed", error);
        setMessage(getAuthErrorMessage(error, mode));
        setLoading(false);
        return;
      }

      if (data.session) {
        setMessage("Signed in successfully.");
        router.push("/dashboard");
        router.refresh();
      } else {
        setMessage("Check your email to confirm your account.");
      }

      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logAuthError("signInWithPassword failed", error);
      setMessage(getAuthErrorMessage(error, mode));
    } else {
      setMessage("Signed in successfully.");
      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
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
            {mode === "sign-in" ? "Sign in to your workspace" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Use your email and password to access Hakimi Auto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-[var(--muted-strong)]">
            Email
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2"
            />
          </label>
          <label className="block text-sm font-medium text-[var(--muted-strong)]">
            Password
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="mt-2"
            />
          </label>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Working..." : mode === "sign-in" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setMessage(null);
          }}
          className="focus-ring mt-5 w-full rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:bg-white/[0.06] hover:text-[var(--foreground)]"
        >
          {mode === "sign-in"
            ? "Need an account? Sign up"
            : "Already have one? Sign in"}
        </button>

        {message ? (
          <p
            className={`mt-5 rounded-[var(--radius)] border px-3 py-2 text-sm ${
              isSuccessMessage(message)
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                : "border-rose-300/20 bg-rose-300/10 text-rose-100"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
