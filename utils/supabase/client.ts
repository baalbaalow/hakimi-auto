import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfigError, getSupabasePublicConfig } from "@/utils/supabase/config"

export { getSupabaseConfigError }

export function createClient() {
  const config = getSupabasePublicConfig()

  return createBrowserClient(
    config.url,
    config.publishableKey,
  )
}
