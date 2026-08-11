"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  ShieldCheck,
  Settings,
  Sparkles,
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
    <aside className="flex h-full flex-col border-r border-white/[0.08] bg-[rgba(16,20,16,0.96)] shadow-[16px_0_50px_-42px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <div className="px-5 py-5">
        <BrandLogo href="/dashboard" priority />
        <div className="mt-5 rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.035] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <Sparkles size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                Creator workspace
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Draft operations
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Workspace navigation">
        <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Manage
        </p>
        {appNavLinks.map((link) => {
          const Icon = iconMap[link.label as keyof typeof iconMap];
          const active = isActive(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`focus-ring group flex items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-emerald-300/18 bg-emerald-300/[0.08] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-strong)] hover:border-white/[0.08] hover:bg-white/[0.045] hover:text-[var(--foreground)]"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] ${
                  active
                    ? "bg-emerald-300/12 text-emerald-200"
                    : "bg-white/[0.04] text-[var(--muted)] group-hover:text-[var(--muted-strong)]"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
              </span>
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
              aria-current={active ? "page" : undefined}
              className={`focus-ring mb-1 flex items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-emerald-300/18 bg-emerald-300/[0.08] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-strong)] hover:border-white/[0.08] hover:bg-white/[0.045] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-white/[0.04] text-[var(--muted)]">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
        <div className="mb-2 mt-3 flex items-center gap-2 rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-[var(--muted)]">
          <ShieldCheck size={14} className="text-emerald-200" aria-hidden="true" />
          Workspace protected
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
