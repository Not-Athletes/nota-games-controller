/** Server-side NOTA dashboard API config (never expose the token to the browser). */

import type { NextApiRequest, NextApiResponse } from "next";
import { isSupabaseConfigured } from "@/lib/config/api";
import { getSupabaseAccessToken } from "@/lib/supabase/server-pages";

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

export async function getNotaApiTokenFromRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string> {
  if (isSupabaseConfigured()) {
    const supabaseToken = await getSupabaseAccessToken(req, res);
    if (supabaseToken) {
      return supabaseToken;
    }
  }

  return getNotaEnvToken();
}

export async function getNotaAuthHeaders(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Record<string, string>> {
  const token = await getNotaApiTokenFromRequest(req, res);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
