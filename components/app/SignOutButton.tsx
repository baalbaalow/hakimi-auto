"use client";

import { LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACTIVE_UPLOAD_STORAGE_KEY,
  LAST_ACTIVITY_STORAGE_KEY,
  LOGOUT_STORAGE_KEY,
} from "@/lib/inactivity";
import { createClient } from "@/utils/supabase/client";

type SignOutButtonProps = {
  compact?: boolean;
};

export function SignOutButton({ compact = false }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
    window.localStorage.removeItem(ACTIVE_UPLOAD_STORAGE_KEY);
    window.localStorage.setItem(LOGOUT_STORAGE_KEY, String(Date.now()));
    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="focus-ring flex w-full items-center gap-3 rounded-[var(--radius)] border border-transparent px-3 py-2.5 text-sm font-medium text-[var(--muted-strong)] transition hover:border-white/[0.08] hover:bg-white/[0.045] hover:text-[var(--foreground)] disabled:opacity-60"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-white/[0.04] text-[var(--muted)]">
        <LogOut size={16} aria-hidden="true" />
      </span>
      {compact ? null : <span>{loading ? "Signing out..." : "Sign out"}</span>}
    </button>
  );
}
