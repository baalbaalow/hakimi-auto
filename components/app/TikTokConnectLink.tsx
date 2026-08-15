type TikTokConnectLinkProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

const baseStyles =
  "focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] px-3 text-sm font-medium transition duration-200";

const variants = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_14px_32px_-20px_rgba(16,185,129,0.95)] hover:bg-[var(--primary-hover)]",
  secondary:
    "border border-[var(--border)] bg-white/[0.055] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-white/[0.09]",
};

export function TikTokConnectLink({
  children,
  variant = "primary",
  className = "",
}: TikTokConnectLinkProps) {
  return (
    <a
      href="/api/tiktok/connect"
      className={`${baseStyles} ${variants[variant]} ${className}`.trim()}
    >
      {children}
    </a>
  );
}
