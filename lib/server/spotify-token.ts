const SPOTIFY_ACCOUNTS_API = "https://accounts.spotify.com/api/token";

type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

export type SpotifyTokenRecord = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  error?: string;
};

async function refreshSpotifyAccessToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
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

  return (await response.json()) as SpotifyTokenResponse;
}

export async function refreshSpotifyTokenRecord(
  token: SpotifyTokenRecord
): Promise<SpotifyTokenRecord> {
  if (!token.refreshToken) {
    return { ...token, accessToken: "", error: "RefreshTokenMissing" };
  }

  const refreshed = await refreshSpotifyAccessToken(token.refreshToken);
  if (!refreshed?.access_token) {
    return { ...token, accessToken: "", error: "RefreshAccessTokenError" };
  }

  return {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
  };
}

export function isSpotifyTokenValid(token: SpotifyTokenRecord) {
  return Boolean(token.accessToken) && token.expiresAt > Math.floor(Date.now() / 1000) + 60;
}
