import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config/api";
import { getNotaEnvToken } from "@/lib/server/nota-api";
import { getSupabaseUser } from "@/lib/supabase/server";

export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  const hasEnvToken = Boolean(getNotaEnvToken());

  if (hasEnvToken) {
    return NextResponse.json({
      requiresAuth: false,
      supabaseConfigured,
      authenticated: true,
      source: "env",
      email: null,
    });
  }

  if (!supabaseConfigured) {
    return NextResponse.json({
      requiresAuth: false,
      supabaseConfigured: false,
      authenticated: false,
      email: null,
      source: null,
    });
  }

  const user = await getSupabaseUser();

  return NextResponse.json({
    requiresAuth: true,
    supabaseConfigured: true,
    authenticated: Boolean(user),
    source: user ? "supabase" : null,
    email: user?.email ?? null,
  });
}
