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
    expires_in: number;
    refresh_token?: string;
  };
}

export async function getValidSpotifyAccessToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await readSpotifySession(req);
  if (!session?.accessToken) {
    clearSpotifySession(res);
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenStillValid = session.expiresAt > now + 60;
  if (tokenStillValid) {
    return {
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    };
  }

  if (!session.refreshToken) {
    clearSpotifySession(res);
    return null;
  }

  const refreshed = await refreshSpotifyAccessToken(session.refreshToken);
  if (!refreshed?.access_token) {
    clearSpotifySession(res);
    return null;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
  await setSpotifySession(res, {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? session.refreshToken,
    expiresAt,
    profileId: session.profileId,
  });

  return {
    accessToken: refreshed.access_token,
    expiresAt,
  };
}
