import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-white/[0.16] bg-white/[0.03] p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.05] text-[var(--muted-strong)]">
        <Icon size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
