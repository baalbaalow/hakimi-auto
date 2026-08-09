import "server-only";

import { createClient } from "@/utils/supabase/server";

const TIKTOK_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const TIKTOK_USER_FIELDS = "open_id,display_name,avatar_url";

export const TIKTOK_STATE_COOKIE = "hakimi_tiktok_oauth_state";

export const tiktokStateCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/tiktok",
  maxAge: 10 * 60,
};

type TikTokConfig = {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
};

type TikTokTokenResponse = {
  open_id: string;
  scope?: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  token_type?: string;
};

type TikTokUserInfo = {
  open_id?: string;
  display_name?: string;
  avatar_url?: string;
};

type TikTokAccountData = {
  user_id: string;
  tiktok_open_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
};

type TikTokApiError = {
  error?: string;
  error_description?: string;
  log_id?: string;
};

type TikTokUserInfoResponse = {
  data?: {
    user?: TikTokUserInfo;
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
};

export function generateTikTokState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Buffer.from(bytes).toString("base64url");
}

export function getTikTokConfig(): TikTokConfig | null {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    clientKey,
    clientSecret,
    redirectUri,
  };
}

export function buildTikTokAuthorizationUrl(config: TikTokConfig, state: string) {
  const url = new URL(TIKTOK_AUTHORIZE_URL);

  url.searchParams.set("client_key", config.clientKey);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user.info.basic");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);

  return url;
}

export async function exchangeTikTokCode(
  config: TikTokConfig,
  code: string,
): Promise<TikTokTokenResponse | null> {
  const body = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body,
  });

  const payload = (await response.json()) as Partial<TikTokTokenResponse> &
    TikTokApiError;

  if (!response.ok || payload.error) {
    logTikTokError("token exchange failed", {
      error: payload.error,
      error_description: payload.error_description,
      log_id: payload.log_id,
    });
    return null;
  }

  if (
    !payload.open_id ||
    !payload.access_token ||
    !payload.refresh_token ||
    typeof payload.expires_in !== "number" ||
    typeof payload.refresh_expires_in !== "number"
  ) {
    logTikTokError("token exchange returned incomplete payload");
    return null;
  }

  return {
    open_id: payload.open_id,
    scope: payload.scope,
    access_token: payload.access_token,
    expires_in: payload.expires_in,
    refresh_token: payload.refresh_token,
    refresh_expires_in: payload.refresh_expires_in,
    token_type: payload.token_type,
  };
}

export async function fetchTikTokUserInfo(
  accessToken: string,
): Promise<TikTokUserInfo | null> {
  const url = new URL(TIKTOK_USER_INFO_URL);
  url.searchParams.set("fields", TIKTOK_USER_FIELDS);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as TikTokUserInfoResponse;

  if (!response.ok || (payload.error && payload.error.code !== "ok")) {
    logTikTokError("user info request failed", {
      code: payload.error?.code,
      message: payload.error?.message,
      log_id: payload.error?.log_id,
    });
    return null;
  }

  return payload.data?.user ?? null;
}

export async function saveTikTokAccount(
  accountData: TikTokAccountData,
): Promise<boolean> {
  const supabase = await createClient();
  const { data: existingAccount, error: selectError } = await supabase
    .from("tiktok_accounts")
    .select("id")
    .eq("user_id", accountData.user_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    logTikTokError("existing account lookup failed", {
      code: selectError.code,
      message: selectError.message,
    });
    return false;
  }

  if (existingAccount) {
    const { error } = await supabase
      .from("tiktok_accounts")
      .update(accountData)
      .eq("id", existingAccount.id);

    if (error) {
      logTikTokError("account update failed", {
        code: error.code,
        message: error.message,
      });
      return false;
    }

    return true;
  }

  const { error } = await supabase.from("tiktok_accounts").insert(accountData);

  if (error) {
    logTikTokError("account insert failed", {
      code: error.code,
      message: error.message,
    });
    return false;
  }

  return true;
}

export function buildTikTokAccountData(
  userId: string,
  token: TikTokTokenResponse,
  userInfo: TikTokUserInfo | null,
): TikTokAccountData {
  return {
    user_id: userId,
    tiktok_open_id: userInfo?.open_id ?? token.open_id,
    display_name: userInfo?.display_name ?? null,
    avatar_url: userInfo?.avatar_url ?? null,
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    access_token_expires_at: secondsFromNowToIso(token.expires_in),
    refresh_token_expires_at: secondsFromNowToIso(token.refresh_expires_in),
  };
}

function secondsFromNowToIso(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(Date.now() + seconds * 1000).toISOString();
}

function logTikTokError(context: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error(`[tiktok] ${context}`, details);
}
