/** Server-side NOTA dashboard API config (never expose the token to the browser). */

import { isSupabaseConfigured } from "@/lib/config/api";
import { getSupabaseAccessToken } from "@/lib/supabase/server";

export function getNotaServerBaseUrl(): string {
  return (
    process.env.NOTA_API_BASE_URL ??
    process.env.NEXT_PUBLIC_NOTA_API_BASE_URL ??
    ""
  ).replace(/\/$/, "");
}

export function isNotaApiBaseConfigured(): boolean {
  return getNotaServerBaseUrl().length > 0;
}

/** Static server token for automation only. */
export function getNotaEnvToken(): string {
  return process.env.NOTA_API_TOKEN?.trim() ?? "";
}

export async function getNotaApiToken(): Promise<string> {
  if (isSupabaseConfigured()) {
    const supabaseToken = await getSupabaseAccessToken();
    if (supabaseToken) {
      return supabaseToken;
    }
  }

  return getNotaEnvToken();
}

export async function getNotaAuthHeaders(): Promise<Record<string, string>> {
  const token = await getNotaApiToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
