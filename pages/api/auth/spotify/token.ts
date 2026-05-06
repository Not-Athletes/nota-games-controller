import type { NextApiRequest, NextApiResponse } from "next";
import { getValidSpotifyAccessToken } from "@/lib/server/spotify-auth";
import { clearSpotifySession } from "@/lib/server/spotify-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const validToken = await getValidSpotifyAccessToken(req, res);
  if (!validToken?.accessToken) {
    clearSpotifySession(res);
    return res.status(401).json({ error: "No valid Spotify session found" });
  }

  return res.status(200).json({
    accessToken: validToken.accessToken,
    expiresAt: validToken.expiresAt,
  });
}
