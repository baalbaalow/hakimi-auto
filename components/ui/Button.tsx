import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type SharedButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type LinkButtonProps = SharedButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & {
    href: string;
  };

type NativeButtonProps = SharedButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

const baseStyles =
  "focus-ring inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-55";

const variants = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_14px_32px_-20px_rgba(16,185,129,0.95)] hover:bg-[var(--primary-hover)]",
  secondary:
    "border border-[var(--border)] bg-white/[0.055] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-white/[0.09]",
  ghost:
    "text-[var(--muted-strong)] hover:bg-white/[0.06] hover:text-[var(--foreground)]",
  danger:
    "bg-[var(--danger)] text-white shadow-[0_12px_30px_-18px_rgba(251,113,133,0.85)] hover:brightness-110",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim();

  if (href) {
    const linkProps = props as Omit<
      LinkButtonProps,
      keyof SharedButtonProps | "href"
    >;

    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      type="button"
      className={classes}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
