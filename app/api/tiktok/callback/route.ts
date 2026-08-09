import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildTikTokAccountData,
  exchangeTikTokCode,
  fetchTikTokUserInfo,
  getTikTokConfig,
  saveTikTokAccount,
  tiktokStateCookieOptions,
  TIKTOK_STATE_COOKIE,
} from "@/lib/tiktok-oauth";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnedState = requestUrl.searchParams.get("state");
  const tiktokError = requestUrl.searchParams.get("error");
  const storedState = (await cookies()).get(TIKTOK_STATE_COOKIE)?.value;

  if (tiktokError || !code || !returnedState) {
    return redirectToAccounts(request, "error", true);
  }

  if (!storedState || storedState !== returnedState) {
    return redirectToAccounts(request, "error", true);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToAccounts(request, "error", true);
  }

  const config = getTikTokConfig();

  if (!config) {
    return redirectToAccounts(request, "error", true);
  }

  const token = await exchangeTikTokCode(config, code);

  if (!token) {
    return redirectToAccounts(request, "error", true);
  }

  const userInfo = await fetchTikTokUserInfo(token.access_token);
  const saved = await saveTikTokAccount(
    buildTikTokAccountData(user.id, token, userInfo),
  );

  return redirectToAccounts(request, saved ? "success" : "error", true);
}

function redirectToAccounts(
  request: Request,
  status: "success" | "error",
  clearState: boolean,
) {
  const url = new URL("/accounts", request.url);
  url.searchParams.set("connected", status);

  const response = NextResponse.redirect(url);

  if (clearState) {
    response.cookies.set(TIKTOK_STATE_COOKIE, "", {
      ...tiktokStateCookieOptions,
      maxAge: 0,
    });
  }

  return response;
}
