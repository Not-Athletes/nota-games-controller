"use client";

import Image from "next/image";
import type { SpotifyNowPlaying, SpotifyStatus } from "@/lib/spotify";
import type { SessionConfig } from "@/types/session";

type SpotifyNowPlayingProps = {
  config: SessionConfig;
  spotifyStatus: SpotifyStatus;
  nowPlaying: SpotifyNowPlaying | null;
  onToggleEnabled: (enabled: boolean) => void;
};

export function SpotifyNowPlaying({
  config,
  spotifyStatus,
  nowPlaying,
  onToggleEnabled,
}: SpotifyNowPlayingProps) {
  const isSpotifyConnected = spotifyStatus.authenticated && spotifyStatus.playerReady;
  const isMusicOn = config.spotifyEnabled && Boolean(config.spotifyPlaylistUri?.trim());
  const spotifyIconSrc = isSpotifyConnected
    ? "/icons/Primary_Logo_Green_RGB.svg"
    : "/icons/Primary_Logo_Black_PMS_C.svg";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Now playing</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={config.spotifyEnabled}
            onClick={() => onToggleEnabled(!config.spotifyEnabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              config.spotifyEnabled ? "bg-[#1DB954]" : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                config.spotifyEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-xs font-medium text-zinc-800">
            {config.spotifyEnabled ? "On" : "Off"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-sm bg-zinc-50 p-3 ring-1 ring-zinc-200">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
          {nowPlaying?.albumArtUrl ? (
            <Image
              src={nowPlaying.albumArtUrl}
              alt={`${nowPlaying.albumName} cover`}
              width={48}
              height={48}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-500">
              N/A
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {!isMusicOn ? "Music off" : nowPlaying?.trackName ?? "No track playing"}
          </p>
          {!isMusicOn ? null : (
            <p className="truncate text-xs text-zinc-600">
              {nowPlaying
                ? `${nowPlaying.artistName} - ${nowPlaying.albumName}`
                : "Spotify"}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-600">
            <Image
              src={spotifyIconSrc}
              alt=""
              width={12}
              height={12}
              className="h-3 w-3"
            />
            <p className="truncate">
              {spotifyStatus.authenticated
                ? spotifyStatus.playerReady
                  ? "Connected"
                  : "Connecting…"
                : "Not connected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
