import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type AuthErrorDetails = {
  name?: string;
  code?: string;
  status?: number;
  message?: string;
};

function logAuthCallbackError(context: string, error?: AuthErrorDetails) {
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "callback");

  if (!code) {
    logAuthCallbackError("callback missing auth code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logAuthCallbackError("exchangeCodeForSession failed", error);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
