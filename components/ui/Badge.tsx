type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "accent";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variants = {
  neutral: "border-[var(--border)] bg-white/[0.06] text-[var(--muted-strong)]",
  success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  warning: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  danger: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  accent: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${variants[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
