import { redirect } from "next/navigation";
import LoginPageClient from "@/app/login/LoginPageClient";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseConfigError } from "@/utils/supabase/config";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

function getInitialMessage(error: string | string[] | undefined) {
  const errorCode = Array.isArray(error) ? error[0] : error;

  if (errorCode === "callback") {
    return "We couldn't complete sign-in. Please try again.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configError = getSupabaseConfigError();
  const params = searchParams ? await searchParams : undefined;

  if (configError) {
    return (
      <LoginPageClient
        initialMessage={configError}
        supabaseConfigError={configError}
      />
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims?.sub) {
    redirect("/dashboard");
  }

  return <LoginPageClient initialMessage={getInitialMessage(params?.error)} />;
}
