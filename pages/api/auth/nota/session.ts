import type { NextApiRequest, NextApiResponse } from "next";
import { isSupabaseConfigured } from "@/lib/config/api";
import { getNotaEnvToken } from "@/lib/server/nota-api";
import { getSupabaseUser } from "@/lib/supabase/server-pages";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (getNotaEnvToken()) {
    return res.status(200).json({
      authenticated: true,
      source: "env",
      email: null,
    });
  }

  if (!isSupabaseConfigured()) {
    return res.status(200).json({ authenticated: false, email: null });
  }

  const user = await getSupabaseUser(req, res);

  return res.status(200).json({
    authenticated: Boolean(user),
    source: user ? "supabase" : null,
    email: user?.email ?? null,
  });
}
