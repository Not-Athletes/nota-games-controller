import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Validates the user with Supabase Auth before trusting session data. */
export async function getVerifiedUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/** Returns a bearer token only after the user has been verified server-side. */
export async function getVerifiedAccessToken(supabase: SupabaseClient): Promise<string | null> {
  const user = await getVerifiedUser(supabase);
  if (!user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}
