"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { AmbientGlow } from "@/components/effects/AmbientGlow";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

const MIN_PASSWORD_LENGTH = 8;
const expiredResetLinkMessage =
  "That reset link is no longer active. Request a new password reset email.";

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      if (!data.session) {
        setError(expiredResetLinkMessage);
      }

      setCheckingSession(false);
    });

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading || checkingSession) {
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setError(expiredResetLinkMessage);
      return;
    }

    const validationError = getPasswordValidationError(
      password,
      confirmPassword,
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("password")
          ? "Choose a stronger password."
          : "Your password could not be updated. Request a new reset link and try again.",
      );
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reason=password-updated");
    router.refresh();
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
            Password reset
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            Choose a new password
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Use a new password that is at least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <PasswordField
            label="New password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setError(null);
            }}
            visible={showPassword}
            onToggleVisible={() => setShowPassword((current) => !current)}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setError(null);
            }}
            visible={showConfirmPassword}
            onToggleVisible={() => setShowConfirmPassword((current) => !current)}
            autoComplete="new-password"
          />

          {error ? (
            <p className="rounded-[var(--radius)] border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading || checkingSession}>
            <LockKeyhole size={16} aria-hidden="true" />
            {checkingSession
              ? "Checking reset link..."
              : loading
                ? "Updating password..."
                : "Update Password"}
          </Button>
        </form>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: "new-password";
}) {
  return (
    <label className="block text-sm font-medium text-[var(--muted-strong)]">
      {label}
      <span className="relative mt-2 block">
        <Input
          type={visible ? "text" : "password"}
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder="Enter a new password"
          className="pr-11"
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
    </label>
  );
}

function getPasswordValidationError(password: string, confirmPassword: string) {
  if (!password) {
    return "Enter a new password.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!confirmPassword) {
    return "Confirm your new password.";
  }

  if (password !== confirmPassword) {
    return "The password confirmation does not match.";
  }

  return null;
}
