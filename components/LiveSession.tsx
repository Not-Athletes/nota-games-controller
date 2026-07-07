"use client";

import { useEffect, useState } from "react";
import { NotaAppNav } from "@/components/NotaAppNav";
import { SessionScoresSection } from "@/components/dashboard/SessionScoresSection";
import { LivePassCard } from "@/components/live/LivePassCard";
import { SessionControls } from "@/components/SessionControls";
import { useSessionScores, type TeamScore } from "@/hooks/useSessionScores";
import type { Phase, SessionConfig, SessionState } from "@/types/session";

type LiveSessionProps = {
  state: SessionState;
  config: SessionConfig;
  onResumeNextPass?: () => void;
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

const TEAM_CARD: Record<string, { card: string; label: string; score: string }> = {
  "team-red": {
    card: "bg-gradient-to-b from-red-50 to-red-50/40",
    label: "text-red-700",
    score: "text-red-900",
  },
  "team-blue": {
    card: "bg-gradient-to-b from-blue-50 to-blue-50/40",
    label: "text-blue-700",
    score: "text-blue-900",
  },
};

function TeamScoreCard({ team }: { team: TeamScore }) {
  const theme = TEAM_CARD[team.id] ?? {
    card: "bg-zinc-50",
    label: "text-zinc-500",
    score: "text-zinc-900",
  };

  return (
    <div className={`flex min-h-32 flex-col rounded-sm p-5 ${theme.card}`}>
      <p className={`text-xs font-semibold tracking-[0.1em] ${theme.label}`}>{team.name}</p>
      <p className={`mt-auto font-display text-4xl font-bold tabular-nums leading-none md:text-5xl ${theme.score}`}>
        {team.combinedScore.toLocaleString()}
      </p>
    </div>
  );
}

export function LiveSession({
  state,
  config,
  onResumeNextPass,
}: LiveSessionProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!state.startedAtMs || state.endedAtMs) return;

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [state.startedAtMs, state.endedAtMs]);

  const currentElapsedSeconds = state.startedAtMs
    ? Math.max(0, Math.floor(((state.endedAtMs ?? nowMs) - state.startedAtMs) / 1000))
    : 0;
  const timerDisplaySeconds = state.phase === "complete" ? 0 : state.timeRemaining;
  const isPassBreak = state.phase === "passBreak";
  const isPassPaused = isPassBreak && state.isPaused;
  const phaseDisplay = isPassBreak && !state.isPaused ? "PASS BREAK" : phaseLabel[state.phase];
  const { teamScores } = useSessionScores();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <NotaAppNav />
      </header>

      <div className="flex flex-col gap-4 text-sm text-zinc-700">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5 md:col-span-2">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-zinc-500">TIMER</p>
              {phaseDisplay ? (
                <p className="text-right text-lg font-semibold tracking-wide text-zinc-900 md:text-xl">
                  {phaseDisplay}
                </p>
              ) : null}
            </div>
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
          <LivePassCard
            currentPass={state.currentPass}
            totalPasses={config.totalPasses}
            isPassPaused={isPassPaused}
            config={config}
          />
          <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5 text-left">
            <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-zinc-500">ELAPSED</p>
            <p className="mt-auto self-start text-left font-display text-4xl font-bold leading-none text-zinc-900 md:text-5xl">
              {formatSeconds(currentElapsedSeconds)}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          {teamScores.map((team) => (
            <TeamScoreCard key={team.id} team={team} />
          ))}
        </div>
      </div>

      <SessionControls
        onResumeNextPass={onResumeNextPass}
        showResumeNextPass={isPassPaused}
      />

      <SessionScoresSection />
    </div>
  );
}
