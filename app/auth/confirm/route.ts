import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const emailOtpTypes = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

type EmailOtpType = (typeof emailOtpTypes)[number];
type AuthErrorDetails = {
  name?: string;
  code?: string;
  status?: number;
  message?: string;
};

function logAuthConfirmError(context: string, error?: AuthErrorDetails) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error(`[auth] ${context}`, error ? {
    name: error.name,
    code: error.code,
    status: error.status,
    message: error.message,
  } : undefined);
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = getEmailOtpType(requestUrl.searchParams.get("type"));
  const next = getSafeNextPath(
    requestUrl.searchParams.get("next"),
    requestUrl.origin,
    type === "recovery" ? "/reset-password" : "/dashboard",
  );
  const failureUrl = getFailureUrl(requestUrl, type, next);

  if (!tokenHash || !type) {
    logAuthConfirmError("confirm route missing token hash or valid type");
    return NextResponse.redirect(failureUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    logAuthConfirmError("verifyOtp failed", error);
    return NextResponse.redirect(failureUrl);
  }

  const destination = type === "recovery" ? "/reset-password" : next;

  return NextResponse.redirect(new URL(destination, request.url));
}

function getEmailOtpType(value: string | null): EmailOtpType | null {
  return emailOtpTypes.find((type) => type === value) ?? null;
}

function getFailureUrl(
  requestUrl: NextRequest["nextUrl"],
  type: EmailOtpType | null,
  next: string,
) {
  const url =
    type === "recovery" || next === "/reset-password"
      ? new URL("/forgot-password", requestUrl.origin)
      : new URL("/login", requestUrl.origin);

  url.searchParams.set(
    "error",
    type === "recovery" || next === "/reset-password" ? "session" : "callback",
  );

  return url;
}

function getSafeNextPath(value: string | null, origin: string, fallback: string) {
  if (!value?.startsWith("/")) {
    return fallback;
  }

  const nextUrl = new URL(value, origin);

  if (nextUrl.origin !== origin) {
    return fallback;
  }

  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}
