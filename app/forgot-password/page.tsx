import { redirect } from "next/navigation";
import ForgotPasswordPageClient from "@/app/forgot-password/ForgotPasswordPageClient";
import { createClient } from "@/utils/supabase/server";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

function getInitialMessage(error: string | string[] | undefined) {
  const errorCode = Array.isArray(error) ? error[0] : error;

  if (errorCode === "session") {
    return "That reset link is no longer active. Request a new password reset email.";
  }

  if (errorCode === "callback") {
    return "We couldn't open that reset link. Request a new password reset email.";
  }

  return null;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims?.sub) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;

  return (
    <ForgotPasswordPageClient
      initialMessage={getInitialMessage(params?.error)}
    />
  );
}
