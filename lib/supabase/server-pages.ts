import type { NextApiRequest, NextApiResponse } from "next";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
  type CookieOptions,
} from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/config/api";
import { getVerifiedAccessToken, getVerifiedUser } from "@/lib/supabase/auth-helpers";

export function createSupabasePagesClient(req: NextApiRequest, res: NextApiResponse) {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured");
  }

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(req.headers.cookie ?? "").flatMap((cookie) =>
          cookie.value === undefined ? [] : [{ name: cookie.name, value: cookie.value }]
        );
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        res.setHeader(
          "Set-Cookie",
          cookiesToSet.map(({ name, value, options }) =>
            serializeCookieHeader(name, value, options)
          )
        );
      },
    },
  });
}

export async function getSupabaseAccessToken(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabasePagesClient(req, res);
  return getVerifiedAccessToken(supabase);
}

export async function getSupabaseUser(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabasePagesClient(req, res);
  return getVerifiedUser(supabase);
}
