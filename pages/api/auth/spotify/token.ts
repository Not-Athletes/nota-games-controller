import type { NextApiRequest, NextApiResponse } from "next";
import {
  clearSpotifySession,
  readSpotifySession,
  setSpotifySession,
} from "@/lib/server/spotify-session";

const SPOTIFY_ACCOUNTS_API = "https://accounts.spotify.com/api/token";

async function refreshSpotifyAccessToken(refreshToken: string) {
  const clientID = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientID || !clientSecret) {
    return null;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientID,
    client_secret: clientSecret,
  });

  const response = await fetch(SPOTIFY_ACCOUNTS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await readSpotifySession(req);
  if (!session?.accessToken) {
    clearSpotifySession(res);
    return res.status(401).json({ error: "No Spotify session found" });
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenStillValid = session.expiresAt > now + 60;
  if (tokenStillValid) {
    return res.status(200).json({
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    });
  }

  if (!session.refreshToken) {
    clearSpotifySession(res);
    return res.status(401).json({ error: "Spotify session expired" });
  }

  const refreshed = await refreshSpotifyAccessToken(session.refreshToken);
  if (!refreshed?.access_token) {
    clearSpotifySession(res);
    return res.status(401).json({ error: "Failed to refresh Spotify token" });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
  await setSpotifySession(res, {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? session.refreshToken,
    expiresAt,
    profileId: session.profileId,
  });

  return res.status(200).json({
    accessToken: refreshed.access_token,
    expiresAt,
  });
}
