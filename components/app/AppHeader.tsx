"use client";

import { Menu } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[rgba(8,11,20,0.82)] px-4 backdrop-blur-xl lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.05] text-[var(--foreground)] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <h1 className="truncate text-base font-semibold text-[var(--foreground)]">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
        Secured
      </span>
    </header>
  );
}
