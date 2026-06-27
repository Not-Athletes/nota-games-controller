"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { NotaAppNav } from "@/components/NotaAppNav";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { SessionControls } from "@/components/SessionControls";
import type { SpotifyNowPlaying, SpotifyStatus } from "@/lib/spotify";
import type { Phase, SessionConfig, SessionState } from "@/types/session";

type LiveSessionProps = {
  state: SessionState;
  config: SessionConfig;
  spotifyStatus: SpotifyStatus;
  nowPlaying: SpotifyNowPlaying | null;
  onEndSession: () => void;
  onResumeNextPass?: () => void;
  onGoHome: () => void;
  onToggleSpotifyEnabled: (enabled: boolean) => void;
};

const phaseLabel: Record<Phase, string> = {
  idle: "IDLE",
  work: "WORK",
  rest: "REST",
  passBreak: "PAUSED",
  complete: "",
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
  onResumeNextPass,
  onGoHome,
  onToggleSpotifyEnabled,
}: LiveSessionProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

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
  const isMusicOn = config.spotifyEnabled && Boolean(config.spotifyPlaylistUri?.trim());
  const spotifyIconSrc = isSpotifyConnected
    ? "/icons/Primary_Logo_Green_RGB.svg"
    : "/icons/Primary_Logo_Black_PMS_C.svg";
  const currentElapsedSeconds = state.startedAtMs
    ? Math.max(0, Math.floor(((state.endedAtMs ?? nowMs) - state.startedAtMs) / 1000))
    : 0;
  const timerDisplaySeconds = state.phase === "complete" ? 0 : state.timeRemaining;
  const isPassBreak = state.phase === "passBreak";
  const isPassPaused = isPassBreak && state.isPaused;
  const phaseDisplay = isPassBreak && !state.isPaused ? "PASS BREAK" : phaseLabel[state.phase];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <NotaAppNav />
      </header>

      <PresenceIndicator />

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
            {config.totalPasses > 1 ? (
              <p className="mb-2 text-xs text-zinc-500">
                Pass{" "}
                <span className="font-semibold text-zinc-800">
                  {state.currentPass} of {config.totalPasses}
                </span>
              </p>
            ) : null}
            {isPassPaused ? (
              <p className="mb-2 text-xs text-zinc-600">
                Up next: {config.stations} stations × {config.roundsPerStation} rounds,{" "}
                {config.workTime}s work
              </p>
            ) : null}
            <p className="mt-auto self-start text-left font-display text-7xl font-bold tabular-nums text-zinc-900 md:text-6xl">
              {isPassBreak ? "—" : formatSeconds(timerDisplaySeconds)}
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
          <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5 md:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-zinc-500">SPOTIFY MUSIC</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.spotifyEnabled}
                  onClick={() => onToggleSpotifyEnabled(!config.spotifyEnabled)}
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
            <div className="mt-auto flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
                {nowPlaying?.albumArtUrl ? (
                  <Image
                    src={nowPlaying.albumArtUrl}
                    alt={`${nowPlaying.albumName} cover`}
                    width={40}
                    height={40}
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
                    alt="Spotify status"
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
      </div>

      <SessionControls
        onEndSession={onEndSession}
        onResumeNextPass={onResumeNextPass}
        showResumeNextPass={isPassPaused}
        sessionComplete={state.phase === "complete"}
        onGoHome={onGoHome}
      />
    </div>
  );
}
