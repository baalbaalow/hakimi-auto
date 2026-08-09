"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { publicNavLinks } from "@/lib/navigation";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[rgba(5,7,18,0.78)] backdrop-blur-xl">
      <div className="ha-container flex h-16 items-center justify-between gap-4">
        <BrandLogo priority />

        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          {publicNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-strong)] transition hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button href="/login" variant="ghost">
            Login
          </Button>
          <Button href="/login">
            Get Started
          </Button>
        </div>

        <button
          type="button"
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.06] text-[var(--foreground)] md:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/[0.08] bg-[var(--surface)] md:hidden">
          <nav className="ha-container flex flex-col gap-1 py-4" aria-label="Mobile navigation">
            {publicNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="focus-ring rounded-[var(--radius)] px-3 py-3 text-sm font-medium text-[var(--muted-strong)] hover:bg-white/[0.06] hover:text-[var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button href="/login" variant="secondary" onClick={() => setOpen(false)}>
                Login
              </Button>
              <Button href="/login" onClick={() => setOpen(false)}>
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
