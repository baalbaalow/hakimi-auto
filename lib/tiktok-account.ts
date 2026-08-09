import "server-only";

import { createClient } from "@/utils/supabase/server";

export type TikTokAccountSummary = {
  tiktok_open_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
};

export async function getTikTokAccountSummary(
  userId: string,
): Promise<TikTokAccountSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tiktok_accounts")
    .select(
      "tiktok_open_id, display_name, avatar_url, access_token_expires_at, refresh_token_expires_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[tiktok] account summary query failed", {
        code: error.code,
        message: error.message,
      });
    }

    return null;
  }

  return data;
}
