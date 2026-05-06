"use client";

import Image from "next/image";
import { SessionControls } from "@/components/SessionControls";
import { getTotalSessionSeconds } from "@/lib/session";
import type { SpotifyNowPlaying, SpotifyStatus } from "@/lib/spotify";
import type { Phase, SessionConfig, SessionState } from "@/types/session";

type LiveSessionProps = {
  state: SessionState;
  config: SessionConfig;
  currentVolumeTarget: number;
  spotifyStatus: SpotifyStatus;
  nowPlaying: SpotifyNowPlaying | null;
  onEndSession: () => void;
};

const phaseLabel: Record<Phase, string> = {
  idle: "IDLE",
  get_ready: "GET READY",
  work: "WORK",
  rest: "REST",
  rotate: "ROTATE",
  complete: "COMPLETE",
  paused: "PAUSED",
};

function formatSeconds(seconds: number) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function LiveSession({
  state,
  config,
  currentVolumeTarget,
  spotifyStatus,
  nowPlaying,
  onEndSession,
}: LiveSessionProps) {
  const progress =
    state.totalIntervals > 0
      ? Math.min(100, (state.completedIntervals / state.totalIntervals) * 100)
      : 0;
  const isSpotifyConnected = spotifyStatus.authenticated && spotifyStatus.playerReady;
  const spotifyIconSrc = isSpotifyConnected
    ? "/icons/Primary_Logo_Green_RGB.svg"
    : "/icons/Primary_Logo_Black_PMS_C.svg";
  const timerDisplaySeconds =
    state.phase === "complete" ? getTotalSessionSeconds(config) : state.timeRemaining;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="text-center">
        <p className="font-brand text-lg font-bold tracking-[0.06em] text-zinc-600 md:text-xl">
          Not Athletes Games
        </p>
      </header>

      <main className="rounded-sm border border-zinc-300 bg-white p-8 text-center">
        <p className="text-3xl font-semibold tracking-wide md:text-5xl">
          {phaseLabel[state.phase]}
        </p>
        <p className="mt-4 text-7xl font-bold tabular-nums md:text-8xl">
          {formatSeconds(timerDisplaySeconds)}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 text-sm text-zinc-700 md:grid-cols-3">
          <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-4">
            Station {state.currentStation} of {config.stations}
          </div>
          <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-4">
            Round {state.currentRound} of {config.roundsPerStation}
          </div>
          <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-4">
            Music Volume Target: {currentVolumeTarget}%
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="h-3 w-full overflow-hidden rounded-sm bg-zinc-200">
            <div
              className="h-full rounded-sm bg-zinc-900 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            Progress {state.completedIntervals}/{state.totalIntervals}
          </p>
        </div>
      </main>

      <div className="rounded-sm bg-white p-4 text-sm text-zinc-700">
        <div className="flex items-center gap-3">
          <Image
            src={spotifyIconSrc}
            alt="Spotify"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <p>
            {spotifyStatus.authenticated
              ? spotifyStatus.playerReady
                ? "Spotify connected"
                : "Spotify authenticated, player still connecting"
              : "Spotify not connected"}
          </p>
        </div>
      </div>

      <div className="rounded-sm bg-white p-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-sm bg-zinc-100">
            {nowPlaying?.albumArtUrl ? (
              <Image
                src={nowPlaying.albumArtUrl}
                alt={`${nowPlaying.albumName} cover`}
                width={56}
                height={56}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                N/A
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {nowPlaying?.trackName ?? "No track playing"}
            </p>
            <p className="truncate text-xs text-zinc-600">
              {nowPlaying ? `${nowPlaying.artistName} - ${nowPlaying.albumName}` : "Spotify"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex h-8 items-end gap-1">
          {[8, 16, 12, 20, 10, 18, 14, 22].map((height, idx) => (
            <div
              key={`eq-${idx}`}
              className={`w-1 rounded-sm ${
                isSpotifyConnected ? "bg-[#1DB954] animate-pulse" : "bg-zinc-300"
              }`}
              style={{
                height: `${height}px`,
                animationDelay: `${idx * 120}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {state.phase === "complete" ? (
        <div className="rounded-sm border border-zinc-300 bg-white p-6 text-center">
          <p className="text-3xl font-semibold text-zinc-900">Session Complete</p>
          <p className="mt-2 text-zinc-700">Begin cooldown manually</p>
        </div>
      ) : (
        <SessionControls onEndSession={onEndSession} />
      )}
    </div>
  );
}
