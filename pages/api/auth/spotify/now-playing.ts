import type { NextApiRequest, NextApiResponse } from "next";
import { clearSpotifySession } from "@/lib/server/spotify-session";
import { getValidSpotifyAccessToken } from "@/lib/server/spotify-auth";

type NowPlayingResponse = {
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl?: string;
  isPlaying: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const validToken = await getValidSpotifyAccessToken(req, res);
  if (!validToken?.accessToken) {
    clearSpotifySession(res);
    return res.status(401).json({ error: "No valid Spotify session found" });
  }

  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${validToken.accessToken}`,
    },
  });

  if (response.status === 204) {
    return res.status(200).json({ nowPlaying: null });
  }

  if (!response.ok) {
    return res.status(200).json({ nowPlaying: null });
  }

  const payload = (await response.json()) as {
    is_playing?: boolean;
    item?: {
      name?: string;
      artists?: Array<{ name?: string }>;
      album?: {
        name?: string;
        images?: Array<{ url?: string }>;
      };
    };
  };

  if (!payload.item?.name) {
    return res.status(200).json({ nowPlaying: null });
  }

  const nowPlaying: NowPlayingResponse = {
    trackName: payload.item.name ?? "Unknown track",
    artistName:
      payload.item.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ||
      "Unknown artist",
    albumName: payload.item.album?.name ?? "Unknown album",
    albumArtUrl: payload.item.album?.images?.[0]?.url,
    isPlaying: Boolean(payload.is_playing),
  };

  return res.status(200).json({ nowPlaying });
}
