import { NextResponse } from "next/server";
import { auth } from "@/auth";

type NowPlayingResponse = {
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl?: string;
  isPlaying: boolean;
  durationMs?: number;
  progressMs?: number;
};

export async function GET() {
  const session = await auth();

  if (!session?.accessToken || session.error) {
    return NextResponse.json({ error: "No valid Spotify session found" }, { status: 401 });
  }

  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (response.status === 204) {
    return NextResponse.json({ nowPlaying: null });
  }

  if (!response.ok) {
    return NextResponse.json({ nowPlaying: null });
  }

  const payload = (await response.json()) as {
    is_playing?: boolean;
    progress_ms?: number;
    item?: {
      name?: string;
      duration_ms?: number;
      artists?: Array<{ name?: string }>;
      album?: {
        name?: string;
        images?: Array<{ url?: string }>;
      };
    };
  };

  if (!payload.item?.name) {
    return NextResponse.json({ nowPlaying: null });
  }

  const nowPlaying: NowPlayingResponse = {
    trackName: payload.item.name ?? "Unknown track",
    artistName:
      payload.item.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ||
      "Unknown artist",
    albumName: payload.item.album?.name ?? "Unknown album",
    albumArtUrl: payload.item.album?.images?.[0]?.url,
    isPlaying: Boolean(payload.is_playing),
    durationMs: payload.item.duration_ms,
    progressMs: payload.progress_ms,
  };

  return NextResponse.json({ nowPlaying });
}
