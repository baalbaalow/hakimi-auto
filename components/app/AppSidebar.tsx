"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Settings,
  UploadCloud,
  UserRoundCog,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SignOutButton } from "@/components/app/SignOutButton";
import { appNavLinks, appUtilityLinks } from "@/lib/navigation";

type AppSidebarProps = {
  onNavigate?: () => void;
};

const iconMap = {
  Dashboard: LayoutDashboard,
  Upload: UploadCloud,
  Library,
  Accounts: UserRoundCog,
  Settings,
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-white/[0.08] bg-[var(--app-surface)]">
      <div className="px-5 py-5">
        <BrandLogo href="/dashboard" priority />
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Workspace navigation">
        {appNavLinks.map((link) => {
          const Icon = iconMap[link.label as keyof typeof iconMap];
          const active = isActive(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`focus-ring flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white/[0.08] text-[var(--foreground)]"
                  : "text-[var(--muted-strong)] hover:bg-white/[0.05] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        {appUtilityLinks.map((link) => {
          const Icon = iconMap[link.label as keyof typeof iconMap];
          const active = isActive(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`focus-ring mb-1 flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white/[0.08] text-[var(--foreground)]"
                  : "text-[var(--muted-strong)] hover:bg-white/[0.05] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          );
        })}
        <SignOutButton />
      </div>
    </aside>
  );
}
