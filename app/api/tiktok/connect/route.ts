import { NextResponse } from "next/server";
import {
  buildTikTokAuthorizeUrl,
  generateTikTokState,
  getTikTokConfig,
  tiktokStateCookieOptions,
  TIKTOK_STATE_COOKIE,
} from "@/lib/tiktok-login";
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
  const response = NextResponse.redirect(buildTikTokAuthorizeUrl(config, state));

  response.cookies.set(TIKTOK_STATE_COOKIE, state, tiktokStateCookieOptions);

  return response;
}
