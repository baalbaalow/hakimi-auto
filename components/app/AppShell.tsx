"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { AppSidebar } from "@/components/app/AppSidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-background)] text-[var(--foreground)]">
      <div
        aria-hidden="true"
        className="surface-noise pointer-events-none fixed inset-0 opacity-45"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),transparent_36%),linear-gradient(225deg,rgba(245,158,11,0.08),transparent_34%)]"
      />

      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <AppSidebar />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[min(19rem,calc(100vw-2rem))] shadow-2xl">
            <AppSidebar onNavigate={() => setOpen(false)} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.06] text-[var(--foreground)]"
              aria-label="Close navigation"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 lg:pl-72">
        <AppHeader onOpenMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[88rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
