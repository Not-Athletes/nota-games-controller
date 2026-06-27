import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config/api";
import { getNotaEnvToken } from "@/lib/server/nota-api";
import { getSupabaseUser } from "@/lib/supabase/server";

export async function GET() {
  if (getNotaEnvToken()) {
    return NextResponse.json({
      authenticated: true,
      source: "env",
      email: null,
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ authenticated: false, email: null });
  }

  const user = await getSupabaseUser();

  return NextResponse.json({
    authenticated: Boolean(user),
    source: user ? "supabase" : null,
    email: user?.email ?? null,
  });
}
