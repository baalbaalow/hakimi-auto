import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`focus-ring w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition hover:border-[var(--border-strong)] disabled:opacity-55 ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  );
}
