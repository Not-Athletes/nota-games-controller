import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/** @deprecated Use getSupabaseBrowserClient from ./browser in client code. */
export function getSupabaseClient() {
  return getSupabaseBrowserClient();
}
