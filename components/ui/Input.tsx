import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`focus-ring w-full rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.06] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition hover:border-[var(--border-strong)] disabled:opacity-55 ${className}`.trim()}
      {...props}
    />
  );
}
