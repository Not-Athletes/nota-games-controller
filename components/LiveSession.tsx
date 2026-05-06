"use client";

import { SessionControls } from "@/components/SessionControls";
import type { SpotifyStatus } from "@/lib/spotify";
import type { Phase, SessionConfig, SessionState } from "@/types/session";

type LiveSessionProps = {
  state: SessionState;
  config: SessionConfig;
  currentVolumeTarget: number;
  spotifyStatus: SpotifyStatus;
  spotifyWarning?: string;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onRestartPhase: () => void;
  onEndSession: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
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
  spotifyWarning,
  onPause,
  onResume,
  onSkip,
  onRestartPhase,
  onEndSession,
  onVolumeUp,
  onVolumeDown,
}: LiveSessionProps) {
  const progress =
    state.totalIntervals > 0
      ? Math.min(100, (state.completedIntervals / state.totalIntervals) * 100)
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
          Nota Games Class Controller
        </p>
      </header>

      <main className="rounded-sm border border-zinc-300 bg-white p-8 text-center">
        <p className="text-3xl font-semibold tracking-wide md:text-5xl">
          {phaseLabel[state.phase]}
        </p>
        <p className="mt-4 text-7xl font-bold tabular-nums md:text-8xl">
          {formatSeconds(state.timeRemaining)}
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

      <div className="rounded-sm border border-zinc-300 bg-white p-4 text-sm text-zinc-700">
        <p>
          Spotify:{" "}
          {spotifyStatus.authenticated
            ? spotifyStatus.playerReady
              ? "Connected"
              : "Authenticated but player is not ready"
            : "Not connected"}
        </p>
        {spotifyWarning ? <p className="mt-1 text-amber-300">{spotifyWarning}</p> : null}
      </div>

      {state.phase === "complete" ? (
        <div className="rounded-sm border border-zinc-300 bg-white p-6 text-center">
          <p className="text-3xl font-semibold text-zinc-900">Session Complete</p>
          <p className="mt-2 text-zinc-700">Begin cooldown manually</p>
        </div>
      ) : (
        <SessionControls
          canPause={state.isRunning}
          isPaused={state.isPaused}
          onPause={onPause}
          onResume={onResume}
          onSkip={onSkip}
          onRestartPhase={onRestartPhase}
          onEndSession={onEndSession}
          onVolumeUp={onVolumeUp}
          onVolumeDown={onVolumeDown}
          disableVolumeButtons={!spotifyStatus.playerReady}
        />
      )}
    </div>
  );
}
