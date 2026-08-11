"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { appNavLinks, appUtilityLinks } from "@/lib/navigation";

type AppHeaderProps = {
  onOpenMenu: () => void;
};

const allLinks = [...appNavLinks, ...appUtilityLinks];

function getPageTitle(pathname: string) {
  return (
    allLinks.find(
      (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
    )?.label ?? "Workspace"
  );
}

export function AppHeader({ onOpenMenu }: AppHeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[rgba(9,11,9,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[88rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.05] text-[var(--foreground)] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="hidden text-xs text-[var(--muted)] sm:block">
              Hakimi Auto
            </p>
            <h1 className="truncate text-base font-semibold text-[var(--foreground)]">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-[var(--radius)] border border-emerald-300/20 bg-emerald-300/10 px-3 text-xs font-medium text-emerald-200">
            <ShieldCheck size={14} aria-hidden="true" />
            Secured
          </span>
        </div>
      </div>
    </header>
  );
}
