"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

type LayoutProps = {
  children: React.ReactNode;
};

const appPrefixes = ["/dashboard", "/upload", "/library", "/accounts", "/settings"];

function isAppPath(pathname: string) {
  return appPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  if (pathname.startsWith("/login")) {
    return <div className="min-h-screen bg-[var(--background)]">{children}</div>;
  }

  if (isAppPath(pathname)) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
