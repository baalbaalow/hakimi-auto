"use client";

import { LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    router.push("/login");
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="focus-ring flex w-full items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:bg-white/[0.06] hover:text-[var(--foreground)] disabled:opacity-60"
    >
      <LogOut size={16} aria-hidden="true" />
      {compact ? null : <span>{loading ? "Signing out..." : "Sign out"}</span>}
    </button>
  );
}
