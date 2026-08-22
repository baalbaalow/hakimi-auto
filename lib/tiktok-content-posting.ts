import "server-only";

import type {
  TikTokCreatorInfo,
  TikTokCreatorInfoErrorCode,
  TikTokCreatorInfoResult,
} from "@/lib/tiktok-content-posting-types";
import {
  hasAuthorizedTikTokScope,
  normalizeTikTokAuthorizedScopes,
  secondsFromNowToIso,
} from "@/lib/tiktok-login";
import { isUuid } from "@/lib/identifiers";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type {
  TikTokCreatorInfo,
  TikTokCreatorInfoErrorCode,
  TikTokCreatorInfoResult,
} from "@/lib/tiktok-content-posting-types";

export const TIKTOK_CREATOR_INFO_ENDPOINT =
  "https://open.tiktokapis.com/v2/post/publish/creator_info/query/";
export const TIKTOK_DIRECT_POST_ENDPOINT =
  "https://open.tiktokapis.com/v2/post/publish/video/init/";
export const TIKTOK_PUBLISH_STATUS_ENDPOINT =
  "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

const TIKTOK_TOKEN_ENDPOINT =
  "https://open.tiktokapis.com/v2/oauth/token/";
const VIDEO_PUBLISH_SCOPE = "video.publish";
const VIDEO_UPLOAD_SCOPE = "video.upload";
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const API_REQUEST_TIMEOUT_MS = 15_000;
const VIDEO_UPLOAD_TIMEOUT_MS = 120_000;
const MAX_SINGLE_UPLOAD_BYTES = 64 * 1024 * 1024;
const MAX_TIKTOK_CAPTION_LENGTH = 2_200;
const MAX_PUBLISH_ID_LENGTH = 64;
const MAX_TIKTOK_STATUS_LENGTH = 64;
const MAX_TIKTOK_FAIL_REASON_LENGTH = 120;
const SUPPORTED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);
const refreshRequests = new Map<string, Promise<ValidAccessTokenResult>>();

type ValidAccessTokenResult =
  | {
      ok: true;
      accountId: string;
      accessToken: string;
      authorizedScopes: string | null;
    }
  | {
      ok: false;
      code:
        | "unauthenticated"
        | "not_connected"
        | "missing_publish_scope"
        | "authorization_expired"
        | "request_failed";
      message: string;
    };

export type TikTokDirectPostSettings = {
  privacyLevel: string;
  allowComment: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  contentDisclosure: boolean;
  brandContentToggle: boolean;
  brandOrganicToggle: boolean;
  isAigc: boolean;
};

export type TikTokDirectPostResult =
  | {
      ok: true;
      publishId: string;
    }
  | {
      ok: false;
      phase: "pre_init";
      message: string;
    }
  | {
      ok: false;
      phase: "tracking_failed" | "post_init";
      publishId: string;
      message: string;
    };

export type TikTokPublishStatusResult =
  | {
      ok: true;
      status: "processing" | "published" | "failed" | "unchanged";
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

type TikTokRefreshTokenPayload = {
  data?: unknown;
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  refresh_expires_in?: unknown;
  scope?: unknown;
  open_id?: unknown;
  error?: unknown;
  error_description?: unknown;
  log_id?: unknown;
};

type TikTokCreatorInfoPayload = {
  data?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    log_id?: unknown;
  };
};

type TikTokDirectPostPayload = {
  data?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    log_id?: unknown;
  };
};

type TikTokPublishStatusPayload = {
  data?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    log_id?: unknown;
  };
};

type TikTokPublishStatusApiResult =
  | {
      ok: true;
      status: string;
      failReason: string | null;
    }
  | {
      ok: false;
      code: string | null;
      message: string;
      shouldRefreshToken: boolean;
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

  const token = await getValidTikTokAccessToken(user.id);

  if (!token.ok) {
    return creatorInfoError(token.code, token.message);
  }

  if (!hasAuthorizedTikTokScope(token.authorizedScopes, VIDEO_PUBLISH_SCOPE)) {
    return creatorInfoError(
      "missing_publish_scope",
      "Reconnect TikTok to authorize direct publishing.",
    );
  }

  return queryTikTokCreatorInfoWithToken(token.accessToken);
}

export async function getValidTikTokAccessToken(
  authenticatedUserId: string,
  options: {
    accountId?: string;
    forceRefresh?: boolean;
  } = {},
): Promise<ValidAccessTokenResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || user.id !== authenticatedUserId) {
    return tokenError(
      "unauthenticated",
      "Sign in again before connecting to TikTok.",
    );
  }

  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch (error) {
    logContentPostingError("admin client initialization failed", {
      name: getErrorName(error),
    });

    return tokenError(
      "request_failed",
      "TikTok publishing is not configured on the server.",
    );
  }

  const accountQuery = admin
    .from("tiktok_accounts")
    .select(
      "id, tiktok_open_id, access_token, refresh_token, authorized_scopes, access_token_expires_at, refresh_token_expires_at",
    )
    .eq("user_id", authenticatedUserId);
  const { data: account, error: accountError } = options.accountId
    ? await accountQuery.eq("id", options.accountId).maybeSingle()
    : await accountQuery
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  if (accountError) {
    logContentPostingError("credential lookup failed", {
      code: accountError.code,
    });

    return tokenError(
      "request_failed",
      "TikTok authorization could not be checked. Please try again.",
    );
  }

  if (!account?.access_token || !account.refresh_token) {
    return tokenError(
      "not_connected",
      "Connect TikTok before loading publishing settings.",
    );
  }

  if (
    !options.forceRefresh &&
    isSufficientlyValid(account.access_token_expires_at)
  ) {
    return {
      ok: true,
      accountId: account.id,
      accessToken: account.access_token,
      authorizedScopes: account.authorized_scopes,
    };
  }

  if (isExpired(account.refresh_token_expires_at)) {
    return expiredAuthorizationError();
  }

  const refreshRequestKey = `${authenticatedUserId}:${account.id}`;
  const existingRefresh = refreshRequests.get(refreshRequestKey);

  if (existingRefresh) {
    return existingRefresh;
  }

  const refreshRequest = refreshTikTokAccessToken({
    admin,
    authenticatedUserId,
    account: {
      id: account.id,
      tiktok_open_id: account.tiktok_open_id,
      refresh_token: account.refresh_token,
    },
  });
  refreshRequests.set(refreshRequestKey, refreshRequest);

  try {
    return await refreshRequest;
  } finally {
    if (refreshRequests.get(refreshRequestKey) === refreshRequest) {
      refreshRequests.delete(refreshRequestKey);
    }
  }
}

export async function executeTikTokDirectPost(input: {
  caption: string;
  videoBlob: Blob;
  videoMimeType: string;
  videoDurationSeconds: number;
  settings: TikTokDirectPostSettings;
  savePublishId: (
    publishId: string,
    tiktokAccountId: string,
  ) => Promise<boolean>;
}): Promise<TikTokDirectPostResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return preInitError("Sign in again before posting this draft.");
  }

  const token = await getValidTikTokAccessToken(user.id);

  if (!token.ok) {
    return preInitError(token.message);
  }

  if (!hasAuthorizedTikTokScope(token.authorizedScopes, VIDEO_PUBLISH_SCOPE)) {
    return preInitError(
      "Reconnect TikTok to authorize direct publishing.",
    );
  }

  const creatorInfoResult = await queryTikTokCreatorInfoWithToken(
    token.accessToken,
  );

  if (!creatorInfoResult.ok) {
    return preInitError(creatorInfoResult.message);
  }

  const validatedPost = validateDirectPostInput(
    input,
    creatorInfoResult.creatorInfo,
  );

  if (!validatedPost.ok) {
    return preInitError(validatedPost.message);
  }

  const initialization = await initializeTikTokDirectPost({
    accessToken: token.accessToken,
    caption: validatedPost.caption,
    videoSize: input.videoBlob.size,
    settings: validatedPost.settings,
  });

  if (!initialization.ok) {
    return preInitError(initialization.message);
  }

  let publishIdSaved = false;

  try {
    publishIdSaved = await input.savePublishId(
      initialization.publishId,
      token.accountId,
    );
  } catch {
    publishIdSaved = false;
  }

  if (!publishIdSaved) {
    return postInitError(
      "tracking_failed",
      initialization.publishId,
      "TikTok initialized the post, but local tracking could not be saved. Do not retry.",
    );
  }

  const transfer = await uploadVideoToTikTok({
    uploadUrl: initialization.uploadUrl,
    videoBlob: input.videoBlob,
    videoMimeType: input.videoMimeType,
  });

  if (!transfer.ok) {
    return postInitError(
      "post_init",
      initialization.publishId,
      transfer.message,
    );
  }

  return {
    ok: true,
    publishId: initialization.publishId,
  };
}

export async function fetchTikTokPublishStatus(
  uploadId: string,
): Promise<TikTokPublishStatusResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return publishStatusError(
      "Sign in again before checking TikTok publishing status.",
    );
  }

  if (!isUuid(uploadId)) {
    return publishStatusError("This upload could not be found.");
  }

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("id, status, publish_id, tiktok_account_id")
    .eq("id", uploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (uploadError) {
    logContentPostingError("owned upload status lookup failed", {
      code: uploadError.code,
    });
    return publishStatusError(
      "The upload could not be checked. Please try again.",
    );
  }

  if (!upload) {
    return publishStatusError("This upload could not be found.");
  }

  if (upload.status !== "queued" && upload.status !== "processing") {
    return publishStatusError(
      "TikTok status can only be checked for queued or processing uploads.",
    );
  }

  const publishId = getSafePublishId(upload.publish_id);

  if (!publishId) {
    return publishStatusError(
      "This upload does not have a valid TikTok publishing ID.",
    );
  }

  const accountResolution = await resolveTikTokAccountForStatus({
    supabase,
    authenticatedUserId: user.id,
    storedTikTokAccountId: upload.tiktok_account_id,
  });

  if (!accountResolution.ok) {
    return publishStatusError(accountResolution.message);
  }

  let token = await getValidTikTokAccessToken(user.id, {
    accountId: accountResolution.accountId,
  });

  if (!token.ok) {
    return publishStatusError(token.message);
  }

  if (!hasTikTokPublishStatusScope(token.authorizedScopes)) {
    return publishStatusError(
      "Reconnect TikTok to authorize publishing status checks.",
    );
  }

  let statusResult = await requestTikTokPublishStatus({
    accessToken: token.accessToken,
    publishId,
  });

  if (!statusResult.ok && statusResult.shouldRefreshToken) {
    token = await getValidTikTokAccessToken(user.id, {
      accountId: accountResolution.accountId,
      forceRefresh: true,
    });

    if (!token.ok) {
      return publishStatusError(token.message);
    }

    if (!hasTikTokPublishStatusScope(token.authorizedScopes)) {
      return publishStatusError(
        "Reconnect TikTok to authorize publishing status checks.",
      );
    }

    statusResult = await requestTikTokPublishStatus({
      accessToken: token.accessToken,
      publishId,
    });
  }

  if (!statusResult.ok) {
    return publishStatusError(statusResult.message);
  }

  const shouldBackfillAccount = accountResolution.legacyFallback;
  const updateContext = {
    supabase,
    uploadId: upload.id,
    authenticatedUserId: user.id,
    publishId,
    tiktokAccountId: accountResolution.accountId,
    shouldBackfillAccount,
  };

  if (
    statusResult.status === "PROCESSING_UPLOAD" ||
    statusResult.status === "PROCESSING_DOWNLOAD"
  ) {
    const updated = await updateOwnedTikTokPublishingState({
      ...updateContext,
      status: "processing",
      errorMessage: null,
    });

    return updated
      ? publishStatusSuccess(
          "processing",
          "TikTok is still processing this video.",
        )
      : publishStatusPersistenceError();
  }

  if (statusResult.status === "SEND_TO_USER_INBOX") {
    const updated = await updateOwnedTikTokPublishingState({
      ...updateContext,
      status: "processing",
      errorMessage: null,
    });

    return updated
      ? publishStatusSuccess(
          "processing",
          "TikTok sent this video to the creator inbox and has not confirmed a Direct Post.",
        )
      : publishStatusPersistenceError();
  }

  if (statusResult.status === "PUBLISH_COMPLETE") {
    const updated = await updateOwnedTikTokPublishingState({
      ...updateContext,
      status: "published",
      errorMessage: null,
    });

    return updated
      ? publishStatusSuccess(
          "published",
          "TikTok confirmed that this video was published.",
        )
      : publishStatusPersistenceError();
  }

  if (statusResult.status === "FAILED") {
    const failReason = statusResult.failReason ?? "unknown";
    const updated = await updateOwnedTikTokPublishingState({
      ...updateContext,
      status: "failed",
      errorMessage: `TikTok processing failed: ${failReason}`,
    });

    return updated
      ? publishStatusSuccess(
          "failed",
          `TikTok could not publish this video: ${failReason}`,
        )
      : publishStatusPersistenceError();
  }

  logContentPostingError("TikTok returned an unrecognized publishing status", {
    status: statusResult.status,
  });

  if (
    shouldBackfillAccount &&
    !(await backfillOwnedTikTokAccount({
      ...updateContext,
    }))
  ) {
    return publishStatusPersistenceError();
  }

  return publishStatusSuccess(
    "unchanged",
    "TikTok returned an unrecognized publishing status. Please check again later.",
  );
}

async function refreshTikTokAccessToken({
  admin,
  authenticatedUserId,
  account,
}: {
  admin: ReturnType<typeof createAdminClient>;
  authenticatedUserId: string;
  account: {
    id: string;
    tiktok_open_id: string | null;
    refresh_token: string;
  };
}): Promise<ValidAccessTokenResult> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();

  if (!clientKey || !clientSecret) {
    logContentPostingError("token refresh configuration is missing");
    return expiredAuthorizationError();
  }

  let response: Response;
  let payload: TikTokRefreshTokenPayload;

  try {
    response = await fetch(TIKTOK_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });
    payload = (await response.json()) as TikTokRefreshTokenPayload;
  } catch (error) {
    logContentPostingError("token refresh request failed", {
      name: getErrorName(error),
    });
    return expiredAuthorizationError();
  }

  const tokenRecord = asRecord(payload.data) ?? asRecord(payload);
  const responseError = getOptionalString(payload.error);
  const accessToken = getRequiredString(tokenRecord?.access_token);
  const refreshToken = getRequiredString(tokenRecord?.refresh_token);
  const expiresIn = getPositiveInteger(tokenRecord?.expires_in);
  const refreshExpiresIn = getPositiveInteger(
    tokenRecord?.refresh_expires_in,
  );
  const openId = getOptionalString(tokenRecord?.open_id);
  const authorizedScopes = normalizeTikTokAuthorizedScopes(
    tokenRecord?.scope,
  );

  if (
    !response.ok ||
    responseError ||
    !accessToken ||
    !refreshToken ||
    !expiresIn ||
    !refreshExpiresIn ||
    (account.tiktok_open_id && openId && account.tiktok_open_id !== openId)
  ) {
    logContentPostingError("token refresh was rejected", {
      status: response.status,
      error: responseError,
      log_id: getOptionalString(payload.log_id),
    });
    return expiredAuthorizationError();
  }

  const { data: updatedAccount, error: updateError } = await admin
    .from("tiktok_accounts")
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      authorized_scopes: authorizedScopes,
      access_token_expires_at: secondsFromNowToIso(expiresIn),
      refresh_token_expires_at: secondsFromNowToIso(refreshExpiresIn),
    })
    .eq("id", account.id)
    .eq("user_id", authenticatedUserId)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedAccount) {
    logContentPostingError("refreshed credentials could not be stored", {
      code: updateError?.code,
    });
    return expiredAuthorizationError();
  }

  return {
    ok: true,
    accountId: account.id,
    accessToken,
    authorizedScopes,
  };
}

async function resolveTikTokAccountForStatus({
  supabase,
  authenticatedUserId,
  storedTikTokAccountId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  authenticatedUserId: string;
  storedTikTokAccountId: unknown;
}): Promise<
  | { ok: true; accountId: string; legacyFallback: boolean }
  | { ok: false; message: string }
> {
  if (storedTikTokAccountId !== null) {
    if (typeof storedTikTokAccountId !== "string" || !isUuid(storedTikTokAccountId)) {
      return {
        ok: false,
        message: "This upload has an invalid TikTok account link.",
      };
    }

    return {
      ok: true,
      accountId: storedTikTokAccountId,
      legacyFallback: false,
    };
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("tiktok_accounts")
    .select("id")
    .eq("user_id", authenticatedUserId)
    .limit(2);

  if (accountsError) {
    logContentPostingError("legacy TikTok account lookup failed", {
      code: accountsError.code,
    });
    return {
      ok: false,
      message: "The TikTok account for this upload could not be checked.",
    };
  }

  if (!accounts || accounts.length === 0) {
    return {
      ok: false,
      message: "Connect TikTok before checking this publishing status.",
    };
  }

  if (accounts.length !== 1) {
    return {
      ok: false,
      message:
        "This legacy upload is not linked to a TikTok account, and more than one account is available. The account cannot be selected safely.",
    };
  }

  const accountId = accounts[0]?.id;

  if (typeof accountId !== "string" || !isUuid(accountId)) {
    return {
      ok: false,
      message: "The TikTok account for this upload is invalid.",
    };
  }

  return {
    ok: true,
    accountId,
    legacyFallback: true,
  };
}

async function requestTikTokPublishStatus({
  accessToken,
  publishId,
}: {
  accessToken: string;
  publishId: string;
}): Promise<TikTokPublishStatusApiResult> {
  let response: Response;
  let payload: TikTokPublishStatusPayload;

  try {
    response = await fetch(TIKTOK_PUBLISH_STATUS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({ publish_id: publishId }),
      cache: "no-store",
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });
    payload = (await response.json()) as TikTokPublishStatusPayload;
  } catch (error) {
    logContentPostingError("TikTok publish status request failed", {
      name: getErrorName(error),
    });
    return {
      ok: false,
      code: null,
      message: isTimeoutError(error)
        ? "TikTok status checking timed out. Please try again."
        : "TikTok publishing status could not be reached. Please try again.",
      shouldRefreshToken: false,
    };
  }

  const responseCode = getOptionalString(payload.error?.code);

  if (!response.ok || responseCode !== "ok") {
    logContentPostingError("TikTok rejected the publish status request", {
      status: response.status,
      code: responseCode,
      log_id: getOptionalString(payload.error?.log_id),
    });
    return {
      ok: false,
      code: responseCode,
      message: mapTikTokPublishStatusError(response.status, responseCode),
      shouldRefreshToken:
        responseCode === "access_token_invalid" ||
        (response.status === 401 && responseCode === null),
    };
  }

  const data = asRecord(payload.data);
  const status = getSafeTikTokStatus(data?.status);

  if (!status) {
    logContentPostingError("TikTok publish status response was incomplete", {
      status: response.status,
      code: responseCode,
      log_id: getOptionalString(payload.error?.log_id),
    });
    return {
      ok: false,
      code: "invalid_response",
      message: "TikTok returned an incomplete publishing status. Please try again.",
      shouldRefreshToken: false,
    };
  }

  return {
    ok: true,
    status,
    failReason: getSafeTikTokFailReason(data?.fail_reason),
  };
}

async function updateOwnedTikTokPublishingState({
  supabase,
  uploadId,
  authenticatedUserId,
  publishId,
  tiktokAccountId,
  shouldBackfillAccount,
  status,
  errorMessage,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  uploadId: string;
  authenticatedUserId: string;
  publishId: string;
  tiktokAccountId: string;
  shouldBackfillAccount: boolean;
  status: "processing" | "published" | "failed";
  errorMessage: string | null;
}) {
  let updateQuery = supabase
    .from("uploads")
    .update({
      status,
      error_message: errorMessage,
      ...(shouldBackfillAccount
        ? { tiktok_account_id: tiktokAccountId }
        : {}),
    })
    .eq("id", uploadId)
    .eq("user_id", authenticatedUserId)
    .in("status", ["queued", "processing"])
    .eq("publish_id", publishId);

  updateQuery = shouldBackfillAccount
    ? updateQuery.is("tiktok_account_id", null)
    : updateQuery.eq("tiktok_account_id", tiktokAccountId);

  const { data: updatedUpload, error: updateError } = await updateQuery
    .select("id")
    .maybeSingle();

  if (updateError || !updatedUpload) {
    logContentPostingError("owned TikTok publishing state update failed", {
      code: updateError?.code,
    });
    return false;
  }

  return true;
}

async function backfillOwnedTikTokAccount({
  supabase,
  uploadId,
  authenticatedUserId,
  publishId,
  tiktokAccountId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  uploadId: string;
  authenticatedUserId: string;
  publishId: string;
  tiktokAccountId: string;
  shouldBackfillAccount: boolean;
}) {
  const { data: updatedUpload, error: updateError } = await supabase
    .from("uploads")
    .update({ tiktok_account_id: tiktokAccountId })
    .eq("id", uploadId)
    .eq("user_id", authenticatedUserId)
    .in("status", ["queued", "processing"])
    .eq("publish_id", publishId)
    .is("tiktok_account_id", null)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedUpload) {
    logContentPostingError("legacy TikTok account backfill failed", {
      code: updateError?.code,
    });
    return false;
  }

  return true;
}

async function queryTikTokCreatorInfoWithToken(
  accessToken: string,
): Promise<TikTokCreatorInfoResult> {
  let response: Response;
  let payload: TikTokCreatorInfoPayload;

  try {
    response = await fetch(TIKTOK_CREATOR_INFO_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });
    payload = (await response.json()) as TikTokCreatorInfoPayload;
  } catch (error) {
    logContentPostingError("Creator Info request failed", {
      name: getErrorName(error),
    });

    return creatorInfoError(
      "request_failed",
      "TikTok Creator Info could not be reached. Please try again.",
    );
  }

  const responseCode = getOptionalString(payload.error?.code);

  if (!response.ok || responseCode !== "ok") {
    logContentPostingError("TikTok rejected Creator Info", {
      status: response.status,
      code: responseCode,
      log_id: getOptionalString(payload.error?.log_id),
    });

    return mapTikTokCreatorInfoError(response.status, responseCode);
  }

  const creatorInfo = parseTikTokCreatorInfo(payload.data);

  if (!creatorInfo) {
    logContentPostingError("Creator Info response was incomplete", {
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

function validateDirectPostInput(
  input: {
    caption: string;
    videoBlob: Blob;
    videoMimeType: string;
    videoDurationSeconds: number;
    settings: TikTokDirectPostSettings;
  },
  creatorInfo: TikTokCreatorInfo,
):
  | {
      ok: true;
      caption: string;
      settings: {
        privacyLevel: string;
        disableComment: boolean;
        disableDuet: boolean;
        disableStitch: boolean;
        brandContentToggle: boolean;
        brandOrganicToggle: boolean;
        isAigc: boolean;
      };
    }
  | { ok: false; message: string } {
  const caption = input.caption.trim();
  const privacyLevel = input.settings.privacyLevel.trim();

  if (!caption || caption.length > MAX_TIKTOK_CAPTION_LENGTH) {
    return {
      ok: false,
      message: "The draft caption is not valid for TikTok.",
    };
  }

  if (!creatorInfo.privacyLevelOptions.includes(privacyLevel)) {
    return {
      ok: false,
      message:
        "That privacy option is no longer available. Reload the draft and choose a current TikTok privacy option.",
    };
  }

  if (
    input.settings.contentDisclosure &&
    !input.settings.brandContentToggle &&
    !input.settings.brandOrganicToggle
  ) {
    return {
      ok: false,
      message:
        "Choose Your brand, Branded content, or both for content disclosure.",
    };
  }

  if (
    !input.settings.contentDisclosure &&
    (input.settings.brandContentToggle || input.settings.brandOrganicToggle)
  ) {
    return {
      ok: false,
      message: "Content disclosure settings are inconsistent. Review them and try again.",
    };
  }

  if (input.settings.brandContentToggle && privacyLevel === "SELF_ONLY") {
    return {
      ok: false,
      message:
        "Branded content cannot use private visibility. Choose another TikTok privacy option or turn off Branded content.",
    };
  }

  if (
    !Number.isFinite(input.videoDurationSeconds) ||
    input.videoDurationSeconds <= 0
  ) {
    return {
      ok: false,
      message: "The video duration could not be verified safely.",
    };
  }

  if (input.videoDurationSeconds > creatorInfo.maxVideoPostDurationSec) {
    return {
      ok: false,
      message: `This video is longer than TikTok's current ${creatorInfo.maxVideoPostDurationSec}-second limit for this creator.`,
    };
  }

  if (input.videoBlob.size <= 0) {
    return { ok: false, message: "The stored video file is empty." };
  }

  if (input.videoBlob.size > MAX_SINGLE_UPLOAD_BYTES) {
    return {
      ok: false,
      message: "This video is too large for the current single-chunk upload.",
    };
  }

  if (!SUPPORTED_VIDEO_MIME_TYPES.has(input.videoMimeType)) {
    return {
      ok: false,
      message: "This video's file type is not supported by TikTok Direct Post.",
    };
  }

  return {
    ok: true,
    caption,
    settings: {
      privacyLevel,
      disableComment:
        creatorInfo.commentDisabled || !input.settings.allowComment,
      disableDuet: creatorInfo.duetDisabled || !input.settings.allowDuet,
      disableStitch:
        creatorInfo.stitchDisabled || !input.settings.allowStitch,
      brandContentToggle: input.settings.contentDisclosure
        ? input.settings.brandContentToggle
        : false,
      brandOrganicToggle: input.settings.contentDisclosure
        ? input.settings.brandOrganicToggle
        : false,
      isAigc: input.settings.isAigc,
    },
  };
}

async function initializeTikTokDirectPost({
  accessToken,
  caption,
  videoSize,
  settings,
}: {
  accessToken: string;
  caption: string;
  videoSize: number;
  settings: {
    privacyLevel: string;
    disableComment: boolean;
    disableDuet: boolean;
    disableStitch: boolean;
    brandContentToggle: boolean;
    brandOrganicToggle: boolean;
    isAigc: boolean;
  };
}): Promise<
  | { ok: true; publishId: string; uploadUrl: string }
  | { ok: false; message: string }
> {
  let response: Response;
  let payload: TikTokDirectPostPayload;

  try {
    response = await fetch(TIKTOK_DIRECT_POST_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: settings.privacyLevel,
          disable_duet: settings.disableDuet,
          disable_comment: settings.disableComment,
          disable_stitch: settings.disableStitch,
          brand_content_toggle: settings.brandContentToggle,
          brand_organic_toggle: settings.brandOrganicToggle,
          is_aigc: settings.isAigc,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });
    payload = (await response.json()) as TikTokDirectPostPayload;
  } catch (error) {
    logContentPostingError("Direct Post initialization request failed", {
      name: getErrorName(error),
    });
    return directPostError(
      "TikTok Direct Post could not be reached. Please try again.",
    );
  }

  const responseCode = getOptionalString(payload.error?.code);

  if (!response.ok || responseCode !== "ok") {
    logContentPostingError("TikTok rejected Direct Post initialization", {
      status: response.status,
      code: responseCode,
      log_id: getOptionalString(payload.error?.log_id),
    });
    return directPostError(mapDirectPostError(response.status, responseCode));
  }

  const data = asRecord(payload.data);
  const rawPublishId = data?.publish_id;
  const rawUploadUrl = data?.upload_url;
  const publishId = getSafePublishId(rawPublishId);
  const uploadUrl = getSafeTikTokUploadUrl(rawUploadUrl);

  if (
    !publishId ||
    !uploadUrl
  ) {
    const uploadUrlMetadata = getUrlDiagnosticMetadata(rawUploadUrl);
    const validationDiagnostic = {
      status: response.status,
      code: responseCode,
      rawPublishIdExists:
        rawPublishId !== null && rawPublishId !== undefined,
      rawPublishIdLength:
        typeof rawPublishId === "string" ? rawPublishId.length : null,
      rawUploadUrlExists:
        rawUploadUrl !== null && rawUploadUrl !== undefined,
      rawUploadUrlLength:
        typeof rawUploadUrl === "string" ? rawUploadUrl.length : null,
      uploadUrlProtocol: uploadUrlMetadata.protocol,
      uploadUrlHostname: uploadUrlMetadata.hostname,
      publishIdAccepted: Boolean(publishId),
      uploadUrlAccepted: Boolean(uploadUrl),
    };

    logContentPostingError("Direct Post initialization response was incomplete", {
      status: validationDiagnostic.status,
      code: validationDiagnostic.code,
      log_id: getOptionalString(payload.error?.log_id),
      raw_publish_id_exists: validationDiagnostic.rawPublishIdExists,
      raw_publish_id_length: validationDiagnostic.rawPublishIdLength,
      raw_upload_url_exists: validationDiagnostic.rawUploadUrlExists,
      raw_upload_url_length: validationDiagnostic.rawUploadUrlLength,
      upload_url_protocol: validationDiagnostic.uploadUrlProtocol,
      upload_url_hostname: validationDiagnostic.uploadUrlHostname,
      publish_id_accepted: validationDiagnostic.publishIdAccepted,
      upload_url_accepted: validationDiagnostic.uploadUrlAccepted,
    });
    return directPostError(
      `TikTok returned an incomplete upload response. Diagnostic: ${formatDirectPostValidationDiagnostic(validationDiagnostic)}`,
    );
  }

  return {
    ok: true,
    publishId,
    uploadUrl,
  };
}

async function uploadVideoToTikTok({
  uploadUrl,
  videoBlob,
  videoMimeType,
}: {
  uploadUrl: string;
  videoBlob: Blob;
  videoMimeType: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  let response: Response;

  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": videoMimeType,
        "Content-Length": String(videoBlob.size),
        "Content-Range": `bytes 0-${videoBlob.size - 1}/${videoBlob.size}`,
      },
      body: videoBlob,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(VIDEO_UPLOAD_TIMEOUT_MS),
    });
  } catch (error) {
    logContentPostingError("video transfer failed", {
      name: getErrorName(error),
    });
    return directPostError(
      isTimeoutError(error)
        ? "TikTok upload status is uncertain after a timeout. Do not retry until publishing status is checked."
        : "TikTok upload status is uncertain after a network error. Do not retry until publishing status is checked.",
    );
  }

  if (response.status !== 201) {
    logContentPostingError("TikTok rejected video transfer", {
      status: response.status,
    });
    return directPostError(mapUploadError(response.status));
  }

  return { ok: true };
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
      "TikTok authorization expired. Reconnect TikTok.",
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

function mapDirectPostError(status: number, responseCode: string | null) {
  if (responseCode === "privacy_level_option_mismatch") {
    return "That privacy option changed on TikTok. Reload the draft and choose a current option.";
  }

  if (responseCode === "scope_not_authorized") {
    return "Reconnect TikTok to authorize direct publishing.";
  }

  if (status === 401 || responseCode === "access_token_invalid") {
    return "TikTok authorization expired. Reconnect TikTok.";
  }

  if (status === 429 || responseCode === "rate_limit_exceeded") {
    return "TikTok's posting rate limit was reached. Please wait and try again.";
  }

  if (responseCode === "spam_risk_too_many_posts") {
    return "TikTok's daily posting limit was reached for this account.";
  }

  if (responseCode === "spam_risk_user_banned_from_posting") {
    return "TikTok is not allowing this account to create new posts.";
  }

  if (responseCode === "reached_active_user_cap") {
    return "The TikTok Sandbox active-user limit was reached.";
  }

  if (responseCode === "unaudited_client_can_only_post_to_private_accounts") {
    return "Sandbox/unaudited Direct Post testing requires private visibility.";
  }

  if (responseCode === "invalid_param" || status === 400) {
    return "TikTok rejected one or more publishing settings. Reload the draft and try again.";
  }

  if (status >= 500) {
    return "TikTok is temporarily unavailable. Please try again later.";
  }

  return "TikTok could not initialize this post. Please try again.";
}

function mapTikTokPublishStatusError(
  status: number,
  responseCode: string | null,
) {
  if (responseCode === "invalid_publish_id") {
    return "TikTok could not find this publishing record.";
  }

  if (responseCode === "token_not_authorized_for_specified_publish_id") {
    return "The connected TikTok account is not authorized for this publishing record.";
  }

  if (responseCode === "scope_not_authorized") {
    return "Reconnect TikTok to authorize publishing status checks.";
  }

  if (status === 401 || responseCode === "access_token_invalid") {
    return "TikTok authorization expired. Reconnect TikTok.";
  }

  if (status === 429 || responseCode === "rate_limit_exceeded") {
    return "TikTok status was checked too often. Please wait and try again.";
  }

  if (status >= 500 || responseCode === "internal_error") {
    return "TikTok is temporarily unable to check publishing status. Please try again later.";
  }

  return "TikTok could not check this publishing status. Please try again.";
}

function mapUploadError(status: number) {
  if (status === 400) {
    return "TikTok rejected the video upload request. Do not retry until publishing status is checked.";
  }

  if (status === 403) {
    return "The TikTok upload authorization expired or was rejected. Do not retry until publishing status is checked.";
  }

  if (status === 404) {
    return "The TikTok upload destination expired or could not be found. Do not retry until publishing status is checked.";
  }

  if (status === 416) {
    return "TikTok rejected the video byte range. Do not retry until publishing status is checked.";
  }

  if (status >= 500) {
    return "TikTok's upload service returned an error. Do not retry until publishing status is checked.";
  }

  return "TikTok did not confirm the video transfer. Do not retry until publishing status is checked.";
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

function directPostError(message: string) {
  return {
    ok: false as const,
    message,
  };
}

function publishStatusSuccess(
  status: Extract<TikTokPublishStatusResult, { ok: true }>["status"],
  message: string,
): TikTokPublishStatusResult {
  return {
    ok: true,
    status,
    message,
  };
}

function publishStatusError(message: string): TikTokPublishStatusResult {
  return {
    ok: false,
    message,
  };
}

function publishStatusPersistenceError(): TikTokPublishStatusResult {
  return publishStatusError(
    "TikTok returned a status, but the owned upload record changed before it could be saved. Refresh and check again.",
  );
}

function preInitError(message: string): TikTokDirectPostResult {
  return {
    ok: false,
    phase: "pre_init",
    message,
  };
}

function postInitError(
  phase: "tracking_failed" | "post_init",
  publishId: string,
  message: string,
): TikTokDirectPostResult {
  return {
    ok: false,
    phase,
    publishId,
    message,
  };
}

function tokenError(
  code: Exclude<ValidAccessTokenResult, { ok: true }>["code"],
  message: string,
): ValidAccessTokenResult {
  return {
    ok: false,
    code,
    message,
  };
}

function expiredAuthorizationError(): ValidAccessTokenResult {
  return tokenError(
    "authorization_expired",
    "TikTok authorization expired. Reconnect TikTok.",
  );
}

function isSufficientlyValid(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  const expiresAt = Date.parse(value);

  return (
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now() + ACCESS_TOKEN_REFRESH_MARGIN_MS
  );
}

function isExpired(value: unknown) {
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

function hasTikTokPublishStatusScope(authorizedScopes: string | null) {
  return (
    hasAuthorizedTikTokScope(authorizedScopes, VIDEO_PUBLISH_SCOPE) ||
    hasAuthorizedTikTokScope(authorizedScopes, VIDEO_UPLOAD_SCOPE)
  );
}

function getSafeTikTokStatus(value: unknown) {
  const status = getRequiredString(value);

  return status &&
    status.length <= MAX_TIKTOK_STATUS_LENGTH &&
    /^[A-Z0-9_]+$/.test(status)
    ? status
    : null;
}

function getSafeTikTokFailReason(value: unknown) {
  const failReason = getOptionalString(value);

  if (!failReason) {
    return null;
  }

  const sanitized = failReason
    .slice(0, MAX_TIKTOK_FAIL_REASON_LENGTH)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || null;
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

function getSafeTikTokUploadUrl(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 256
  ) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isTikTokHost =
      hostname === "tiktokapis.com" ||
      hostname.endsWith(".tiktokapis.com") ||
      hostname === "tiktokapis.us" ||
      hostname.endsWith(".tiktokapis.us");

    return url.protocol === "https:" && isTikTokHost && !url.hash
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function getSafePublishId(value: unknown) {
  const publishId = getRequiredString(value);

  if (
    !publishId ||
    publishId.length > MAX_PUBLISH_ID_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(publishId)
  ) {
    return null;
  }

  return publishId;
}

function getUrlDiagnosticMetadata(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return {
      protocol: null,
      hostname: null,
    };
  }

  try {
    const url = new URL(value);

    return {
      protocol: url.protocol || null,
      hostname: url.hostname || null,
    };
  } catch {
    return {
      protocol: null,
      hostname: null,
    };
  }
}

function formatDirectPostValidationDiagnostic(diagnostic: {
  status: number;
  code: string;
  rawPublishIdExists: boolean;
  rawPublishIdLength: number | null;
  rawUploadUrlExists: boolean;
  rawUploadUrlLength: number | null;
  uploadUrlProtocol: string | null;
  uploadUrlHostname: string | null;
  publishIdAccepted: boolean;
  uploadUrlAccepted: boolean;
}) {
  return [
    `status=${diagnostic.status}`,
    `code=${diagnostic.code}`,
    `raw_publish_id_exists=${diagnostic.rawPublishIdExists}`,
    `raw_publish_id_length=${diagnostic.rawPublishIdLength ?? "null"}`,
    `raw_upload_url_exists=${diagnostic.rawUploadUrlExists}`,
    `raw_upload_url_length=${diagnostic.rawUploadUrlLength ?? "null"}`,
    `upload_url_protocol=${diagnostic.uploadUrlProtocol ?? "null"}`,
    `upload_url_hostname=${diagnostic.uploadUrlHostname ?? "null"}`,
    `publish_id_accepted=${diagnostic.publishIdAccepted}`,
    `upload_url_accepted=${diagnostic.uploadUrlAccepted}`,
  ].join(" ");
}

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

function isTimeoutError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

function logContentPostingError(
  context: string,
  details?: Record<string, unknown>,
) {
  console.error(`[tiktok content posting] ${context}`, details);
}
