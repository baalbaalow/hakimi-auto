import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type TikTokAccountRow = {
  id: string;
  user_id: string;
  tiktok_open_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  authorized_scopes: string | null;
  access_token: string | null;
  refresh_token: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AdminDatabase = {
  public: {
    Tables: {
      tiktok_accounts: {
        Row: TikTokAccountRow;
        Insert: Omit<Partial<TikTokAccountRow>, "user_id"> & {
          user_id: string;
        };
        Update: Partial<TikTokAccountRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

let adminClient: SupabaseClient<AdminDatabase> | null = null;

export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase admin client is not configured.");
  }

  adminClient = createClient<AdminDatabase>(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}
