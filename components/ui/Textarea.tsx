import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`focus-ring w-full resize-y rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] transition hover:border-[var(--border-strong)] disabled:opacity-55 ${className}`.trim()}
      {...props}
    />
  );
}
