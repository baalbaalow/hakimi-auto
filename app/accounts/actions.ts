"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const TIKTOK_REVOKE_URL = "https://open.tiktokapis.com/v2/oauth/revoke/";

export type DisconnectTikTokState = {
  ok: boolean | null;
  message: string | null;
};

type TikTokRevokePayload = {
  error?: string;
  error_description?: string;
  log_id?: string;
};

export async function disconnectTikTokAccount(): Promise<DisconnectTikTokState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Sign in again before disconnecting TikTok.",
    };
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();

  if (!clientKey || !clientSecret) {
    console.error("[tiktok] Missing client credentials for revoke", {
      hasClientKey: Boolean(clientKey),
      hasClientSecret: Boolean(clientSecret),
    });

    return {
      ok: false,
      message: "TikTok disconnect is not configured. Check the server environment.",
    };
  }

  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[tiktok] admin client initialization for disconnect failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      ok: false,
      message: "TikTok disconnect is not configured. Check the server environment.",
    };
  }

  const { data: account, error: accountError } = await admin
    .from("tiktok_accounts")
    .select("id, access_token")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (accountError) {
    console.error("[tiktok] account lookup for disconnect failed", {
      code: accountError.code,
      message: accountError.message,
    });

    return {
      ok: false,
      message: "TikTok connection could not be checked. Please try again.",
    };
  }

  if (!account?.access_token) {
    return {
      ok: false,
      message: "No connected TikTok account was found.",
    };
  }

  const revoked = await revokeTikTokToken({
    clientKey,
    clientSecret,
    accessToken: account.access_token,
  });

  if (!revoked.ok) {
    return {
      ok: false,
      message: revoked.message,
    };
  }

  const { error: deleteError } = await admin
    .from("tiktok_accounts")
    .delete()
    .eq("id", account.id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[tiktok] account delete after revoke failed", {
      code: deleteError.code,
      message: deleteError.message,
    });

    return {
      ok: false,
      message: "TikTok authorization was revoked, but the local account row could not be removed.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: "TikTok disconnected.",
  };
}

async function revokeTikTokToken({
  clientKey,
  clientSecret,
  accessToken,
}: {
  clientKey: string;
  clientSecret: string;
  accessToken: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  let response: Response;
  let responseText = "";

  try {
    response = await fetch(TIKTOK_REVOKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        token: accessToken,
      }),
    });

    responseText = await response.text();
  } catch (error) {
    console.error("[tiktok] revoke request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      ok: false,
      message: "TikTok could not be reached. Please try again.",
    };
  }

  const payload = parseTikTokRevokePayload(responseText);

  if (!response.ok || payload?.error) {
    console.error("[tiktok] revoke failed", {
      status: response.status,
      error: payload?.error,
      error_description: payload?.error_description,
      log_id: payload?.log_id,
    });

    return {
      ok: false,
      message: "TikTok did not revoke the connection. Please try again.",
    };
  }

  return { ok: true };
}

function parseTikTokRevokePayload(value: string) {
  if (!value.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as TikTokRevokePayload;
    }
  } catch {
    return null;
  }

  return null;
}
