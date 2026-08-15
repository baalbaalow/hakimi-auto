import { redirect } from "next/navigation";
import LoginPageClient, { type AuthMessage } from "@/app/login/LoginPageClient";
import { createClient } from "@/utils/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    mode?: string | string[];
    reason?: string | string[];
  }>;
};

function getInitialMessage(
  error: string | string[] | undefined,
  reason: string | string[] | undefined,
): AuthMessage | null {
  const errorCode = Array.isArray(error) ? error[0] : error;
  const reasonCode = Array.isArray(reason) ? reason[0] : reason;

  if (errorCode === "callback") {
    return {
      text: "We couldn't complete sign-in. Please try again.",
      tone: "error",
    };
  }

  if (reasonCode === "inactive") {
    return {
      text: "Your session ended after 30 minutes of inactivity. Sign in again to continue.",
      tone: "info",
    };
  }

  if (reasonCode === "password-updated") {
    return {
      text: "Your password was updated. Sign in with the new password.",
      tone: "success",
    };
  }

  return null;
}

function getInitialMode(mode: string | string[] | undefined) {
  const value = Array.isArray(mode) ? mode[0] : mode;

  return value === "signup" ? "sign-up" : "sign-in";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims?.sub) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;

  return (
    <LoginPageClient
      initialMessage={getInitialMessage(params?.error, params?.reason)}
      initialMode={getInitialMode(params?.mode)}
    />
  );
}
