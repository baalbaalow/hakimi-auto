import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const TIKTOK_CREATOR_INFO_ENDPOINT =
  "https://open.tiktokapis.com/v2/post/publish/creator_info/query/";

const VIDEO_PUBLISH_SCOPE = "video.publish";
const CREATOR_INFO_REQUEST_TIMEOUT_MS = 10_000;

export type TikTokCreatorInfo = {
  creatorAvatarUrl: string | null;
  creatorUsername: string;
  creatorNickname: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
};

export type TikTokCreatorInfoErrorCode =
  | "unauthenticated"
  | "not_connected"
  | "missing_publish_scope"
  | "authorization_expired"
  | "rate_limited"
  | "posting_unavailable"
  | "request_failed"
  | "invalid_response";

export type TikTokCreatorInfoResult =
  | {
      ok: true;
      creatorInfo: TikTokCreatorInfo;
    }
  | {
      ok: false;
      code: TikTokCreatorInfoErrorCode;
      message: string;
    };

type TikTokCreatorInfoPayload = {
  data?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    log_id?: unknown;
  };
};

export async function queryTikTokCreatorInfo(): Promise<TikTokCreatorInfoResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return creatorInfoError(
      "unauthenticated",
      "Sign in again before loading TikTok publishing settings.",
    );
  }

  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch (error) {
    logCreatorInfoError("admin client initialization failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return creatorInfoError(
      "request_failed",
      "TikTok publishing settings are not configured on the server.",
    );
  }

  const { data: account, error: accountError } = await admin
    .from("tiktok_accounts")
    .select("access_token, authorized_scopes, access_token_expires_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (accountError) {
    logCreatorInfoError("account lookup failed", {
      code: accountError.code,
      message: accountError.message,
    });

    return creatorInfoError(
      "request_failed",
      "TikTok publishing settings could not be loaded. Please try again.",
    );
  }

  if (!account?.access_token) {
    return creatorInfoError(
      "not_connected",
      "Connect TikTok before loading publishing settings.",
    );
  }

  if (!hasAuthorizedScope(account.authorized_scopes, VIDEO_PUBLISH_SCOPE)) {
    return creatorInfoError(
      "missing_publish_scope",
      "Reconnect TikTok to authorize direct publishing.",
    );
  }

  if (hasExpired(account.access_token_expires_at)) {
    return creatorInfoError(
      "authorization_expired",
      "TikTok authorization has expired. Reconnect TikTok to continue.",
    );
  }

  let response: Response;
  let payload: TikTokCreatorInfoPayload;

  try {
    response = await fetch(TIKTOK_CREATOR_INFO_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(CREATOR_INFO_REQUEST_TIMEOUT_MS),
    });
    payload = (await response.json()) as TikTokCreatorInfoPayload;
  } catch (error) {
    logCreatorInfoError("request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return creatorInfoError(
      "request_failed",
      "TikTok Creator Info could not be reached. Please try again.",
    );
  }

  const responseCode = getOptionalString(payload.error?.code);

  if (!response.ok || responseCode !== "ok") {
    logCreatorInfoError("TikTok rejected the request", {
      status: response.status,
      code: responseCode,
      message: getOptionalString(payload.error?.message),
      log_id: getOptionalString(payload.error?.log_id),
    });

    return mapTikTokCreatorInfoError(response.status, responseCode);
  }

  const creatorInfo = parseTikTokCreatorInfo(payload.data);

  if (!creatorInfo) {
    logCreatorInfoError("response was incomplete", {
      status: response.status,
      code: responseCode,
    });

    return creatorInfoError(
      "invalid_response",
      "TikTok returned incomplete publishing settings. Please try again.",
    );
  }

  return {
    ok: true,
    creatorInfo,
  };
}

function parseTikTokCreatorInfo(value: unknown): TikTokCreatorInfo | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const creatorUsername = getRequiredString(record.creator_username);
  const creatorNickname = getRequiredString(record.creator_nickname);
  const privacyLevelOptions = getStringArray(record.privacy_level_options);
  const commentDisabled = getBoolean(record.comment_disabled);
  const duetDisabled = getBoolean(record.duet_disabled);
  const stitchDisabled = getBoolean(record.stitch_disabled);
  const maxVideoPostDurationSec = getPositiveInteger(
    record.max_video_post_duration_sec,
  );

  if (
    !creatorUsername ||
    !creatorNickname ||
    !privacyLevelOptions ||
    privacyLevelOptions.length === 0 ||
    commentDisabled === null ||
    duetDisabled === null ||
    stitchDisabled === null ||
    maxVideoPostDurationSec === null
  ) {
    return null;
  }

  return {
    creatorAvatarUrl: getSafeHttpUrl(record.creator_avatar_url),
    creatorUsername,
    creatorNickname,
    privacyLevelOptions,
    commentDisabled,
    duetDisabled,
    stitchDisabled,
    maxVideoPostDurationSec,
  };
}

function mapTikTokCreatorInfoError(
  status: number,
  responseCode: string | null,
): TikTokCreatorInfoResult {
  if (responseCode === "scope_not_authorized") {
    return creatorInfoError(
      "missing_publish_scope",
      "Reconnect TikTok to authorize direct publishing.",
    );
  }

  if (status === 401 || responseCode === "access_token_invalid") {
    return creatorInfoError(
      "authorization_expired",
      "TikTok authorization is invalid or expired. Reconnect TikTok to continue.",
    );
  }

  if (status === 429 || responseCode === "rate_limit_exceeded") {
    return creatorInfoError(
      "rate_limited",
      "TikTok publishing settings were requested too often. Please try again shortly.",
    );
  }

  if (
    responseCode === "spam_risk_too_many_posts" ||
    responseCode === "spam_risk_user_banned_from_posting" ||
    responseCode === "reached_active_user_cap"
  ) {
    return creatorInfoError(
      "posting_unavailable",
      "TikTok is not allowing this account to create a new post right now.",
    );
  }

  return creatorInfoError(
    "request_failed",
    "TikTok publishing settings could not be loaded. Please try again.",
  );
}

function creatorInfoError(
  code: TikTokCreatorInfoErrorCode,
  message: string,
): TikTokCreatorInfoResult {
  return {
    ok: false,
    code,
    message,
  };
}

function hasAuthorizedScope(value: unknown, requiredScope: string) {
  if (typeof value !== "string") {
    return false;
  }

  return value
    .split(",")
    .some((scope) => scope.trim() === requiredScope);
}

function hasExpired(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  const expiresAt = Date.parse(value);

  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getRequiredString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function getPositiveInteger(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : null;
}

function getSafeHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function logCreatorInfoError(
  context: string,
  details?: Record<string, unknown>,
) {
  console.error(`[tiktok creator info] ${context}`, details);
}
