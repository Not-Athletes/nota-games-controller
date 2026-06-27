import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/config/api";
import { getVerifiedAccessToken, getVerifiedUser } from "@/lib/supabase/auth-helpers";

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — cookie writes are ignored.
        }
      },
    },
  });
}

export async function getSupabaseAccessToken() {
  const supabase = await createSupabaseServerClient();
  return getVerifiedAccessToken(supabase);
}

export async function getSupabaseUser() {
  const supabase = await createSupabaseServerClient();
  return getVerifiedUser(supabase);
}
