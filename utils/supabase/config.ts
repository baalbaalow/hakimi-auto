const supabaseEnvNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

type SupabaseEnvName = (typeof supabaseEnvNames)[number];

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export function getMissingSupabaseEnvNames(): SupabaseEnvName[] {
  return supabaseEnvNames.filter((name) => !process.env[name]?.trim());
}

export function getSupabaseConfigError() {
  const missing = getMissingSupabaseEnvNames();

  if (missing.length === 0) {
    return null;
  }

  return `Missing Supabase environment configuration: ${missing.join(", ")}.`;
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const error = getSupabaseConfigError();

  if (error) {
    throw new Error(error);
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.trim(),
  };
}
