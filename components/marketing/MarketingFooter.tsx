import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { brand } from "@/lib/brand";
import { footerLinks } from "@/lib/navigation";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[rgba(7,8,6,0.9)]">
      <div className="ha-container flex flex-col gap-8 py-10 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <BrandLogo />
          <p className="mt-4 leading-6">
            A focused workspace for preparing TikTok content and future
            publishing automation.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-[var(--radius-sm)] text-[var(--muted-strong)] transition hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-[var(--muted)]">
          (c) {new Date().getFullYear()} {brand.copyright}
        </p>
      </div>
    </footer>
  );
}
