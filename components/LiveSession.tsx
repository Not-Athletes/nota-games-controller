"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SessionControls } from "@/components/SessionControls";
import type { SpotifyNowPlaying, SpotifyStatus } from "@/lib/spotify";
import type { Phase, SessionConfig, SessionState } from "@/types/session";

type LiveSessionProps = {
  state: SessionState;
  config: SessionConfig;
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
  complete: "",
  paused: "PAUSED",
};

function formatSeconds(seconds: number) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getProgressColor(progressPercent: number) {
  const progress = Math.max(0, Math.min(100, progressPercent)) / 100;
  const start = { r: 245, g: 158, b: 11 }; // amber
  const end = { r: 34, g: 197, b: 94 }; // green

  const r = Math.round(start.r + (end.r - start.r) * progress);
  const g = Math.round(start.g + (end.g - start.g) * progress);
  const b = Math.round(start.b + (end.b - start.b) * progress);

  return `rgb(${r}, ${g}, ${b})`;
}

export function LiveSession({
  state,
  config,
  spotifyStatus,
  nowPlaying,
  onEndSession,
}: LiveSessionProps) {
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    if (!state.startedAtMs || state.endedAtMs) return;

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [state.startedAtMs, state.endedAtMs]);

  const progress =
    state.totalIntervals > 0
      ? Math.min(100, (state.completedIntervals / state.totalIntervals) * 100)
      : 0;
  const isSpotifyConnected = spotifyStatus.authenticated && spotifyStatus.playerReady;
  const spotifyIconSrc = isSpotifyConnected
    ? "/icons/Primary_Logo_Green_RGB.svg"
    : "/icons/Primary_Logo_Black_PMS_C.svg";
  const currentElapsedSeconds = state.startedAtMs
    ? Math.max(0, Math.floor(((state.endedAtMs ?? nowMs) - state.startedAtMs) / 1000))
    : 0;
  const timerDisplaySeconds = state.phase === "complete" ? 0 : state.timeRemaining;
  const phaseDisplay = phaseLabel[state.phase];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="text-center">
        <p className="font-brand text-lg font-bold tracking-[0.06em] text-zinc-600 md:text-xl">
          Not Athletes Games
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 text-sm text-zinc-700 md:grid-cols-3">
          <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-zinc-500">TIMER</p>
              {phaseDisplay ? (
                <p className="text-right text-lg font-semibold tracking-wide text-zinc-900 md:text-xl">
                  {phaseDisplay}
                </p>
              ) : null}
            </div>
            <p className="mt-auto self-start text-left font-display text-7xl font-bold tabular-nums text-zinc-900 md:text-6xl">
              {formatSeconds(timerDisplaySeconds)}
            </p>
          </div>
          <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5 text-left">
            <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-zinc-500">STATION</p>
            <p className="mt-auto self-start text-left font-display text-4xl font-bold leading-none text-zinc-900 md:text-5xl">
              {state.currentStation} of {config.stations}
            </p>
          </div>
          <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5 text-left">
            <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-zinc-500">ROUND</p>
            <p className="mt-auto self-start text-left font-display text-4xl font-bold leading-none text-zinc-900 md:text-5xl">
              {state.currentRound} of {config.roundsPerStation}
            </p>
          </div>
          <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5 text-left md:col-span-2">
            <p className="text-xs font-semibold tracking-[0.1em] text-zinc-500">PROGRESS</p>
            <div className="mt-auto">
              <div className="h-3 w-full overflow-hidden rounded-sm bg-zinc-200">
                <div
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: getProgressColor(progress),
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Progress {state.completedIntervals}/{state.totalIntervals}
              </p>
            </div>
          </div>
          <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5 text-left">
            <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-zinc-500">ELAPSED</p>
            <p className="mt-auto self-start text-left font-display text-4xl font-bold leading-none text-zinc-900 md:text-5xl">
              {formatSeconds(currentElapsedSeconds)}
            </p>
          </div>
          <div className="rounded-sm bg-zinc-50 p-5 md:col-span-3">
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
              <div className="min-w-0 flex-1 text-left">
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

            <div className="mt-3 flex items-center justify-end gap-2 text-xs text-zinc-600">
              <Image
                src={spotifyIconSrc}
                alt="Spotify status"
                width={16}
                height={16}
                className="h-4 w-4"
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
      </div>

      {state.phase !== "complete" ? <SessionControls onEndSession={onEndSession} /> : null}
    </div>
  );
}
