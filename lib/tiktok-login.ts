import "server-only";

import { randomBytes } from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const TIKTOK_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const TIKTOK_USER_INFO_FIELDS = "open_id,avatar_url,display_name";

export const TIKTOK_REQUESTED_SCOPES = [
  "user.info.basic",
] as const;

const requiredTikTokEnvNames = [
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
  "TIKTOK_REDIRECT_URI",
] as const;

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
  avatar_url?: string;
  display_name?: string;
};

type TikTokAccountPayload = {
  tiktok_open_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  authorized_scopes: string | null;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
};

type TikTokTokenPayload = Partial<TikTokTokenResponse> & {
  data?: Partial<TikTokTokenResponse>;
  error?: string;
  error_description?: string;
  log_id?: string;
};

type TikTokUserInfoPayload = {
  data?: {
    user?: TikTokUserInfo;
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
};

export type TikTokAccountSummary = {
  tiktok_open_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  canPublishDirect: boolean;
  canUploadDraft: boolean;
};

export function generateTikTokState() {
  return randomBytes(32).toString("base64url");
}

export function getTikTokConfig(): TikTokConfig | null {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  const redirectUri = process.env.TIKTOK_REDIRECT_URI?.trim();

  if (!clientKey || !clientSecret || !redirectUri) {
    reportMissingTikTokEnv();
    return null;
  }

  return {
    clientKey,
    clientSecret,
    redirectUri,
  };
}

export function buildTikTokAuthorizeUrl(config: TikTokConfig, state: string) {
  const authorizeUrl = new URL(TIKTOK_AUTHORIZE_URL);

  authorizeUrl.searchParams.set("client_key", config.clientKey);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", TIKTOK_REQUESTED_SCOPES.join(","));
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("disable_auto_auth", "1");

  return authorizeUrl;
}

export async function exchangeTikTokCode(
  config: TikTokConfig,
  code: string,
): Promise<TikTokTokenResponse | null> {
  let response: Response;
  let payload: TikTokTokenPayload;

  try {
    response = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: config.clientKey,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
      }),
    });
    payload = (await response.json()) as TikTokTokenPayload;
  } catch (error) {
    logTikTokError("token exchange request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }

  const token = payload.data ?? payload;

  if (!response.ok || payload.error) {
    logTikTokError("token exchange failed", {
      error: payload.error,
      error_description: payload.error_description,
      log_id: payload.log_id,
    });
    return null;
  }

  if (
    !token.open_id ||
    !token.access_token ||
    !token.refresh_token ||
    typeof token.expires_in !== "number" ||
    typeof token.refresh_expires_in !== "number"
  ) {
    logTikTokError("token exchange returned an incomplete response");
    return null;
  }

  return {
    open_id: token.open_id,
    scope: token.scope,
    access_token: token.access_token,
    expires_in: token.expires_in,
    refresh_token: token.refresh_token,
    refresh_expires_in: token.refresh_expires_in,
    token_type: token.token_type,
  };
}

export async function fetchTikTokUserInfo(
  accessToken: string,
): Promise<TikTokUserInfo | null> {
  const url = new URL(TIKTOK_USER_INFO_URL);
  url.searchParams.set("fields", TIKTOK_USER_INFO_FIELDS);

  let response: Response;
  let payload: TikTokUserInfoPayload;

  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    payload = (await response.json()) as TikTokUserInfoPayload;
  } catch (error) {
    logTikTokError("user info request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }

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

export async function getTikTokAccountSummary(
  userId: string,
): Promise<TikTokAccountSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tiktok_accounts")
    .select(
      "tiktok_open_id, display_name, avatar_url, access_token_expires_at, refresh_token_expires_at, authorized_scopes",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logTikTokError("account summary query failed", {
      code: error.code,
      message: error.message,
    });
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    tiktok_open_id: data.tiktok_open_id,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    access_token_expires_at: data.access_token_expires_at,
    refresh_token_expires_at: data.refresh_token_expires_at,
    canPublishDirect: hasAuthorizedTikTokScope(
      data.authorized_scopes,
      "video.publish",
    ),
    canUploadDraft: hasAuthorizedTikTokScope(
      data.authorized_scopes,
      "video.upload",
    ),
  };
}

export async function saveTikTokAccount(
  authenticatedUserId: string,
  account: TikTokAccountPayload,
): Promise<boolean> {
  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch (error) {
    logTikTokError("admin client initialization failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }

  const { data: existingAccount, error: selectError } = await admin
    .from("tiktok_accounts")
    .select("id")
    .eq("user_id", authenticatedUserId)
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
    const { data: updatedAccount, error } = await admin
      .from("tiktok_accounts")
      .update(account)
      .eq("id", existingAccount.id)
      .eq("user_id", authenticatedUserId)
      .select("id")
      .maybeSingle();

    if (error || !updatedAccount) {
      logTikTokError("account update failed", {
        code: error?.code,
        message: error?.message,
      });
      return false;
    }

    return true;
  }

  const { error } = await admin.from("tiktok_accounts").insert({
    ...account,
    user_id: authenticatedUserId,
  });

  if (error) {
    logTikTokError("account insert failed", {
      code: error.code,
      message: error.message,
    });
    return false;
  }

  return true;
}

export function buildTikTokAccountPayload(
  token: TikTokTokenResponse,
  userInfo: TikTokUserInfo | null,
): TikTokAccountPayload {
  return {
    tiktok_open_id: userInfo?.open_id ?? token.open_id,
    display_name: userInfo?.display_name ?? null,
    avatar_url: userInfo?.avatar_url ?? null,
    authorized_scopes: normalizeTikTokAuthorizedScopes(token.scope),
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    access_token_expires_at: secondsFromNowToIso(token.expires_in),
    refresh_token_expires_at: secondsFromNowToIso(token.refresh_expires_in),
  };
}

function normalizeTikTokAuthorizedScopes(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const scopes = Array.from(
    new Set(
      value
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean),
    ),
  );

  return scopes.length > 0 ? scopes.join(",") : null;
}

function hasAuthorizedTikTokScope(
  authorizedScopes: string | null,
  requiredScope: string,
) {
  if (!authorizedScopes) {
    return false;
  }

  return authorizedScopes
    .split(",")
    .some((scope) => scope.trim() === requiredScope);
}

function secondsFromNowToIso(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(Date.now() + seconds * 1000).toISOString();
}

function reportMissingTikTokEnv() {
  const missing = requiredTikTokEnvNames.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missing.length === 0) {
    return;
  }

  console.error("[tiktok] Missing required environment variables", {
    missing,
    diagnostics: {
      TIKTOK_CLIENT_KEY: {
        exists: Boolean(process.env.TIKTOK_CLIENT_KEY?.trim()),
        length: process.env.TIKTOK_CLIENT_KEY?.trim().length ?? 0,
      },
      TIKTOK_CLIENT_SECRET: {
        exists: Boolean(process.env.TIKTOK_CLIENT_SECRET?.trim()),
      },
      TIKTOK_REDIRECT_URI: {
        exists: Boolean(process.env.TIKTOK_REDIRECT_URI?.trim()),
      },
    },
  });
}

function logTikTokError(context: string, details?: Record<string, unknown>) {
  console.error(`[tiktok] ${context}`, details);
}
