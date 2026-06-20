import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/config/api";
import { getVerifiedAccessToken } from "@/lib/supabase/auth-helpers";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  const config = getSupabaseConfig();
  if (!config) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.anonKey);
  }

  return browserClient;
}

export async function syncSupabaseRealtimeAuth() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const accessToken = await getVerifiedAccessToken(supabase);
  if (accessToken) {
    await supabase.realtime.setAuth(accessToken);
  }
}
