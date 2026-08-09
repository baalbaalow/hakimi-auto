import { NextResponse } from "next/server";
import {
  buildTikTokAuthorizationUrl,
  generateTikTokState,
  getTikTokConfig,
  tiktokStateCookieOptions,
  TIKTOK_STATE_COOKIE,
} from "@/lib/tiktok-oauth";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const config = getTikTokConfig();

  if (!config) {
    return NextResponse.redirect(new URL("/accounts?connected=error", request.url));
  }

  const state = generateTikTokState();
  const authorizationUrl = buildTikTokAuthorizationUrl(config, state);
  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set(TIKTOK_STATE_COOKIE, state, tiktokStateCookieOptions);

  return response;
}
