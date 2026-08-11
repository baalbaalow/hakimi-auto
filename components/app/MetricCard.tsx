import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "emerald" | "amber" | "rose" | "neutral";
};

const toneStyles = {
  emerald: "border-emerald-300/18 bg-emerald-300/[0.08] text-emerald-200",
  amber: "border-amber-300/18 bg-amber-300/[0.08] text-amber-200",
  rose: "border-rose-300/18 bg-rose-300/[0.08] text-rose-200",
  neutral: "border-white/[0.1] bg-white/[0.045] text-[var(--muted-strong)]",
};

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {value}
          </p>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border ${toneStyles[tone]}`}
        >
          <Icon size={17} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}
