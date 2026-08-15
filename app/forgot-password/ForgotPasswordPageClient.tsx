"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { AmbientGlow } from "@/components/effects/AmbientGlow";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

type ForgotPasswordPageClientProps = {
  initialMessage?: string | null;
};

function getRecoveryCallbackUrl() {
  return new URL(
    "/auth/callback?next=/reset-password",
    window.location.origin,
  ).toString();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ForgotPasswordPageClient({
  initialMessage = null,
}: ForgotPasswordPageClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialMessage);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const trimmedEmail = email.trim();
    setError(null);
    setMessage(null);

    if (!trimmedEmail) {
      setError("Enter the email address for your account.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmedEmail,
      {
        redirectTo: getRecoveryCallbackUrl(),
      },
    );

    if (resetError) {
      setError(
        resetError.message.toLowerCase().includes("rate")
          ? "Too many reset requests. Please wait a moment and try again."
          : "We couldn't send a reset email. Please try again.",
      );
      setLoading(false);
      return;
    }

    setMessage(
      "If an account exists for that email, Supabase will send a secure password reset link.",
    );
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
            Password recovery
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            Reset your password
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Enter your account email and we will send a secure recovery link.
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
                setError(null);
                setMessage(null);
              }}
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2"
              aria-invalid={Boolean(error)}
            />
          </label>

          {error ? (
            <p className="rounded-[var(--radius)] border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          {message ? (
            <p
              role="status"
              className="rounded-[var(--radius)] border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100"
            >
              {message}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            <Mail size={16} aria-hidden="true" />
            {loading ? "Sending reset email..." : "Send Reset Email"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="focus-ring inline-flex items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:bg-white/[0.06] hover:text-[var(--foreground)]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}
