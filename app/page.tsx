"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { LiveSession } from "@/components/LiveSession";
import { SetupForm } from "@/components/SetupForm";
import { CoachControls } from "@/components/CoachControls";
import { SpotifyConnect } from "@/components/SpotifyConnect";
import { AudioCues } from "@/lib/audio";
import { useNotaCoach } from "@/lib/useNotaCoach";
import type { GameSnapshot } from "@/lib/announcer";
import { getPhaseDuration, getRestDuration, getTotalIntervals } from "@/lib/session";
import {
  spotifyService,
  type SpotifyNowPlaying,
  type SpotifyStatus,
} from "@/lib/spotify";
import type { Phase, SessionConfig, SessionState, SetupInput } from "@/types/session";

const DEFAULT_SETUP: SetupInput = {
  workTime: 45,
  restTime: 15,
  restBetweenStationsTime: 30,
  roundsPerStation: 3,
  stations: 6,
  fullSessionPasses: 2,
  maxTrackPlaySeconds: 190,
  spotifyPlaylistUri: "",
};
const WORK_VOLUME = 100;
const REST_VOLUME = 25;

const INITIAL_STATE: SessionState = {
  phase: "idle",
  currentStation: 1,
  currentRound: 1,
  currentPass: 1,
  timeRemaining: 0,
  isRunning: false,
  isPaused: false,
  completedIntervals: 0,
  totalIntervals: 0,
  startedAtMs: undefined,
  endedAtMs: undefined,
};

const TIMED_PHASES: Phase[] = ["work", "rest"];
const AUTO_NEXT_THRESHOLD_MS = 7000;
const NOW_PLAYING_POLL_MS = 1000;

function makeSnapshot(
  config: SessionConfig,
  station: number,
  round: number,
  pass: number
): GameSnapshot {
  return {
    pass,
    totalPasses: config.fullSessionPasses,
    station,
    totalStations: config.stations,
    round,
    roundsPerStation: config.roundsPerStation,
    workSeconds: config.workTime,
    restSeconds: config.restTime,
    restBetweenStationsSeconds: config.restBetweenStationsTime,
  };
}

export default function Home() {
  const [entryPoint, setEntryPoint] = useState<"launcher" | "controller">("launcher");
  const [setupValues, setSetupValues] = useState<SetupInput>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SETUP;
    }

    try {
      const raw = localStorage.getItem("nota_class_controller_setup");
      if (!raw) return DEFAULT_SETUP;
      const stored = JSON.parse(raw) as Partial<SetupInput> & { attendees?: unknown };
      const { attendees: _legacyAttendees, ...rest } = stored;
      void _legacyAttendees;
      return { ...DEFAULT_SETUP, ...rest };
    } catch {
      return DEFAULT_SETUP;
    }
  });
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>(INITIAL_STATE);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus>({
    connected: false,
    authenticated: false,
    playerReady: false,
  });
  const [nowPlaying, setNowPlaying] = useState<SpotifyNowPlaying | null>(null);

  const audioCuesRef = useRef(new AudioCues());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseEndTimeRef = useRef<number | null>(null);
  const advancingRef = useRef(false);
  const sessionStateRef = useRef(sessionState);
  const sessionConfigRef = useRef<SessionConfig | null>(sessionConfig);
  const autoNextHandledTrackRef = useRef<string | null>(null);
  const tenSecondsCuePlayedRef = useRef<string | null>(null);

  const coach = useNotaCoach(audioCuesRef);
  const coachRef = useRef(coach);
  useEffect(() => {
    coachRef.current = coach;
  }, [coach]);

  useEffect(() => {
    return () => {
      coachRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    sessionConfigRef.current = sessionConfig;
  }, [sessionConfig]);

  const clearTicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateSessionState = useCallback(
    (updater: (prev: SessionState) => SessionState) => {
      const next = updater(sessionStateRef.current);
      sessionStateRef.current = next;
      setSessionState(next);
    },
    []
  );

  const refreshSpotifyStatus = useCallback((error?: string) => {
    setSpotifyStatus({
      ...spotifyService.getStatus(),
      error,
    });
  }, []);

  const setSpotifyVolume = useCallback((volume: number) => {
    if (spotifyService.getStatus().playerReady) {
      void spotifyService.setVolume(volume);
    }
  }, []);

  const celebrateStationComplete = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 45,
      origin: { y: 0.7 },
    });
    confetti({
      particleCount: 50,
      spread: 110,
      startVelocity: 35,
      scalar: 0.8,
      origin: { y: 0.7 },
    });
  }, []);

  const markComplete = useCallback(
    ({ playOutro = true }: { playOutro?: boolean } = {}) => {
      const config = sessionConfigRef.current;
      if (!config) return;

      clearTicker();
      phaseEndTimeRef.current = null;
      updateSessionState((prev) => ({
        ...prev,
        phase: "complete",
        isRunning: false,
        isPaused: false,
        timeRemaining: 0,
        completedIntervals: prev.totalIntervals,
        endedAtMs: prev.endedAtMs ?? Date.now(),
      }));

      setSpotifyVolume(config.restVolume);

      if (playOutro) {
        const snapshot = sessionStateRef.current;
        void coachRef.current.announce({
          type: "session_complete",
          snapshot: makeSnapshot(
            config,
            snapshot.currentStation,
            snapshot.currentRound,
            snapshot.currentPass
          ),
        });
      } else {
        audioCuesRef.current.stopAll();
        coachRef.current.disconnect();
      }
    },
    [clearTicker, setSpotifyVolume, updateSessionState]
  );

  const advancePhase = useCallback(async () => {
    if (advancingRef.current) return;
    const config = sessionConfigRef.current;
    if (!config) return;

    advancingRef.current = true;
    // Stop the ticker from acting until the next phase is committed; otherwise it
    // keeps firing against the now-past phase end time while we await audio cues.
    phaseEndTimeRef.current = null;
    try {
      const current = sessionStateRef.current;

      const finishedTimedPhase = TIMED_PHASES.includes(current.phase);
      const completedIntervals = finishedTimedPhase
        ? Math.min(current.totalIntervals, current.completedIntervals + 1)
        : current.completedIntervals;

      const commitPhase = (
        phase: Phase,
        nextStation: number,
        nextRound: number,
        completed: number,
        durationOverride?: number
      ) => {
        const duration =
          durationOverride ?? getPhaseDuration(phase, config);
        phaseEndTimeRef.current =
          duration > 0 ? Date.now() + duration * 1000 : null;

        updateSessionState((prev) => ({
          ...prev,
          phase,
          currentStation: nextStation,
          currentRound: nextRound,
          timeRemaining: duration,
          isRunning: phase !== "complete" && phase !== "idle",
          isPaused: false,
          completedIntervals: completed,
        }));
      };

      const beginNextPassTransition = async (completed: number) => {
        clearTicker();
        setSpotifyVolume(config.restVolume);
        phaseEndTimeRef.current = null;
        const finishingPass = sessionStateRef.current.currentPass;
        updateSessionState((prev) => ({
          ...prev,
          phase: "passBreak",
          currentStation: 1,
          currentRound: 1,
          timeRemaining: 0,
          isRunning: false,
          isPaused: false,
          completedIntervals: completed,
          currentPass: prev.currentPass + 1,
        }));
        await coachRef.current.announce({
          type: "pass_complete",
          snapshot: makeSnapshot(
            config,
            config.stations,
            config.roundsPerStation,
            finishingPass
          ),
        });
        updateSessionState((prev) => ({
          ...prev,
          isPaused: true,
        }));
      };

      if (current.phase === "work") {
        const isFinalWorkInterval =
          current.currentStation === config.stations &&
          current.currentRound === config.roundsPerStation;
        if (isFinalWorkInterval) {
          if (current.currentPass < config.fullSessionPasses) {
            await beginNextPassTransition(completedIntervals);
            return;
          }
          markComplete();
          return;
        }

        const transitionsToNextStation =
          current.currentRound === config.roundsPerStation &&
          current.currentStation < config.stations;
        setSpotifyVolume(config.restVolume);
        void coachRef.current.announce({
          type: "rest_start",
          betweenStations: transitionsToNextStation,
          snapshot: makeSnapshot(
            config,
            current.currentStation,
            current.currentRound,
            current.currentPass
          ),
        });
        commitPhase(
          "rest",
          current.currentStation,
          current.currentRound,
          completedIntervals,
          transitionsToNextStation
            ? getRestDuration(config, true)
            : undefined
        );
        return;
      }

      if (current.phase === "rest") {
        await Promise.all([
          audioCuesRef.current.waitForCueToFinish("rest"),
          audioCuesRef.current.waitForCueToFinish("switchStation"),
        ]);

        if (current.currentRound < config.roundsPerStation) {
          setSpotifyVolume(config.workVolume);
          await coachRef.current.announce({
            type: "work_start",
            reason: "next_round",
            snapshot: makeSnapshot(
              config,
              current.currentStation,
              current.currentRound + 1,
              current.currentPass
            ),
          });
          commitPhase(
            "work",
            current.currentStation,
            current.currentRound + 1,
            completedIntervals
          );
          return;
        }

        if (current.currentStation < config.stations) {
          celebrateStationComplete();
          setSpotifyVolume(config.workVolume);
          await coachRef.current.announce({
            type: "work_start",
            reason: "next_station",
            snapshot: makeSnapshot(
              config,
              current.currentStation + 1,
              1,
              current.currentPass
            ),
          });
          commitPhase(
            "work",
            current.currentStation + 1,
            1,
            completedIntervals
          );
          return;
        }

        if (current.currentPass < config.fullSessionPasses) {
          await beginNextPassTransition(completedIntervals);
          return;
        }

        markComplete();
        return;
      }

    } finally {
      advancingRef.current = false;
    }
  }, [celebrateStationComplete, markComplete, setSpotifyVolume, updateSessionState]);

  const startTicker = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const phaseEnd = phaseEndTimeRef.current;
      if (!phaseEnd) return;
      const config = sessionConfigRef.current;

      const millisecondsLeft = phaseEnd - Date.now();
      const nextSeconds = Math.max(0, Math.ceil(millisecondsLeft / 1000));
      const current = sessionStateRef.current;
      const warningThreshold = Math.max(1, Math.min(15, config ? config.workTime - 1 : 15));
      if (
        config &&
        current.phase === "work" &&
        nextSeconds > 0 &&
        nextSeconds <= warningThreshold
      ) {
        const cueKey = `${current.currentPass}-${current.currentStation}-${current.currentRound}`;
        if (tenSecondsCuePlayedRef.current !== cueKey) {
          tenSecondsCuePlayedRef.current = cueKey;
          void coachRef.current.announce({
            type: "ten_seconds_left",
            snapshot: makeSnapshot(
              config,
              current.currentStation,
              current.currentRound,
              current.currentPass
            ),
          });
          setSpotifyVolume(config.restVolume);
          void (async () => {
            await audioCuesRef.current.waitForCueToFinish("tenSecondsLeft");
            const latestState = sessionStateRef.current;
            const latestCueKey = `${latestState.currentPass}-${latestState.currentStation}-${latestState.currentRound}`;
            if (latestState.phase === "work" && latestCueKey === cueKey) {
              setSpotifyVolume(config.workVolume);
            }
          })();
        }
      }
      if (nextSeconds !== sessionStateRef.current.timeRemaining) {
        updateSessionState((prev) => ({ ...prev, timeRemaining: nextSeconds }));
      }

      if (millisecondsLeft <= 0) {
        void advancePhase();
      }
    }, 250);
  }, [advancePhase, setSpotifyVolume, updateSessionState]);

  const startSession = useCallback(
    async (config: SessionConfig) => {
      setSessionConfig(config);
      audioCuesRef.current.setCueVolume(config.workVolume);
      await audioCuesRef.current.refreshRestCues();
      await audioCuesRef.current.refreshTenSecondsLeftCues();
      audioCuesRef.current.resetRestShuffle();
      audioCuesRef.current.resetTenSecondsLeftShuffle();
      audioCuesRef.current.stopAll();

      const totalIntervals = getTotalIntervals(config);
      const firstWorkSeconds = getPhaseDuration("work", config);
      updateSessionState(() => ({
        phase: "work",
        currentStation: 1,
        currentRound: 1,
        currentPass: 1,
        timeRemaining: firstWorkSeconds,
        isRunning: false,
        isPaused: false,
        completedIntervals: 0,
        totalIntervals,
        startedAtMs: undefined,
        endedAtMs: undefined,
      }));
      tenSecondsCuePlayedRef.current = null;

      coachRef.current.connect(
        JSON.stringify({
          event: "session_config",
          workSeconds: config.workTime,
          restSeconds: config.restTime,
          restBetweenStationsSeconds: config.restBetweenStationsTime,
          totalStations: config.stations,
          roundsPerStation: config.roundsPerStation,
          totalPasses: config.fullSessionPasses,
        })
      );

      setSpotifyVolume(config.workVolume);
      if (spotifyStatus.playerReady && config.spotifyPlaylistUri) {
        const deviceId = spotifyService.getStatus().deviceId;
        await spotifyService.setShuffle(true, deviceId);
        await spotifyService.playPlaylist(config.spotifyPlaylistUri);
      }
      await coachRef.current.announce({
        type: "session_start",
        snapshot: makeSnapshot(config, 1, 1, 1),
      });

      phaseEndTimeRef.current = Date.now() + firstWorkSeconds * 1000;
      updateSessionState((prev) => ({
        ...prev,
        isRunning: true,
        startedAtMs: Date.now(),
        endedAtMs: undefined,
      }));
      startTicker();
    },
    [
      setSpotifyVolume,
      spotifyStatus.playerReady,
      startTicker,
      updateSessionState,
    ]
  );

  const endSession = useCallback(() => {
    markComplete({ playOutro: false });
  }, [markComplete]);

  const resumeNextPass = useCallback(async () => {
    const config = sessionConfigRef.current;
    const current = sessionStateRef.current;
    if (!config || current.phase !== "passBreak" || !current.isPaused || advancingRef.current) {
      return;
    }

    advancingRef.current = true;
    try {
      setSpotifyVolume(config.workVolume);
      await coachRef.current.announce({
        type: "work_start",
        reason: "next_pass",
        snapshot: makeSnapshot(config, 1, 1, current.currentPass),
      });
      const workDuration = getPhaseDuration("work", config);
      phaseEndTimeRef.current =
        workDuration > 0 ? Date.now() + workDuration * 1000 : null;
      updateSessionState((prev) => ({
        ...prev,
        phase: "work",
        currentStation: 1,
        currentRound: 1,
        timeRemaining: workDuration,
        isRunning: true,
        isPaused: false,
      }));
      startTicker();
    } finally {
      advancingRef.current = false;
    }
  }, [setSpotifyVolume, startTicker, updateSessionState]);

  const handleConnectSpotify = useCallback(() => {
    const status = spotifyService.getStatus();
    if (status.authenticated) {
      void spotifyService.connectPlayer().then((result) => {
        refreshSpotifyStatus(result.ok ? undefined : result.error);
      });
      return;
    }

    window.location.href = "/api/auth/spotify";
  }, [refreshSpotifyStatus]);

  const handleDisconnectSpotify = useCallback(() => {
    void fetch("/api/auth/spotify/logout", { method: "POST" });
    spotifyService.clearToken();
    setNowPlaying(null);
    refreshSpotifyStatus();
  }, [refreshSpotifyStatus]);

  useEffect(() => {
    queueMicrotask(() => {
      refreshSpotifyStatus();
    });

    void spotifyService.bootstrapAuthFromSession().then((hasSession) => {
      if (!hasSession) return;
      void spotifyService.connectPlayer().then((result) => {
        refreshSpotifyStatus(result.ok ? undefined : result.error);
      });
    });

    return () => clearTicker();
  }, [clearTicker, refreshSpotifyStatus]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const state = sessionStateRef.current;
      if (state.isRunning || state.isPaused) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, []);

  useEffect(() => {
    const shouldPollNowPlaying =
      spotifyStatus.authenticated && sessionState.phase !== "idle";
    const canAutoAdvanceTrack =
      sessionState.phase !== "idle" &&
      sessionState.phase !== "complete" &&
      sessionState.phase !== "passBreak" &&
      sessionState.isRunning;

    if (!shouldPollNowPlaying) {
      queueMicrotask(() => {
        setNowPlaying(null);
      });
      autoNextHandledTrackRef.current = null;
      return;
    }

    let cancelled = false;
    const pollNowPlaying = async () => {
      const track = await spotifyService.fetchNowPlaying();
      if (cancelled) return;
      setNowPlaying(track);
      const maxTrackPlayMs =
        (sessionConfigRef.current?.maxTrackPlaySeconds ??
          DEFAULT_SETUP.maxTrackPlaySeconds) * 1000;

      if (!track?.isPlaying || !track.durationMs || track.progressMs === undefined) {
        return;
      }

      const trackKey = `${track.trackName}::${track.artistName}::${track.durationMs}`;
      if (autoNextHandledTrackRef.current !== trackKey) {
        autoNextHandledTrackRef.current = null;
      }

      const remainingMs = track.durationMs - track.progressMs;
      if (
        canAutoAdvanceTrack &&
        ((track.progressMs >= maxTrackPlayMs && track.durationMs > maxTrackPlayMs) ||
          (remainingMs > 0 && remainingMs <= AUTO_NEXT_THRESHOLD_MS)) &&
        autoNextHandledTrackRef.current !== trackKey
      ) {
        autoNextHandledTrackRef.current = trackKey;
        void spotifyService.nextTrack(spotifyStatus.deviceId);
      }
    };

    void pollNowPlaying();
    const nowPlayingInterval = setInterval(() => {
      void pollNowPlaying();
    }, NOW_PLAYING_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(nowPlayingInterval);
    };
  }, [
    sessionState.phase,
    sessionState.isRunning,
    spotifyStatus.authenticated,
    spotifyStatus.deviceId,
    spotifyStatus.playerReady,
  ]);

  const setupPageContent = useMemo(
    () => (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-2 text-center">
          <button
            type="button"
            onClick={() => setEntryPoint("launcher")}
            className="font-brand text-lg font-bold tracking-[0.06em] text-zinc-600 transition hover:text-zinc-900 md:text-xl"
          >
            Not Athletes Games
          </button>
        </header>

        <SpotifyConnect
          status={spotifyStatus}
          onConnect={handleConnectSpotify}
          onDisconnect={handleDisconnectSpotify}
        />

        <CoachControls
          enabled={coach.enabled}
          onEnabledChange={coach.setEnabled}
          status={coach.status}
        />

        <SetupForm
          initialValues={setupValues}
          onStart={(config) => {
            setSetupValues(config);
            localStorage.setItem("nota_class_controller_setup", JSON.stringify(config));
            void startSession({
              ...config,
              workVolume: WORK_VOLUME,
              restVolume: REST_VOLUME,
            });
          }}
        />
      </div>
    ),
    [
      coach.enabled,
      coach.setEnabled,
      coach.status,
      handleConnectSpotify,
      handleDisconnectSpotify,
      setEntryPoint,
      setupValues,
      spotifyStatus,
      startSession,
    ]
  );

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      {sessionState.phase === "idle" && entryPoint === "launcher" ? (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <header className="space-y-3 text-center">
            <p className="font-brand text-lg tracking-[0.06em] text-zinc-600">NOTA Games</p>
            <h1 className="font-display text-3xl font-semibold text-zinc-900 md:text-4xl">
              Event Control Center
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-zinc-600 md:text-base">
              Choose what you want to run on event day.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setEntryPoint("controller")}
              className="group rounded-xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
            >
              <h2 className="font-display text-2xl text-zinc-900">Games Controller</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Run class stations, timing, and Spotify cues.
              </p>
              <span className="mt-5 inline-flex rounded-md bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                Open controller
              </span>
            </button>

            <Link
              href="/raffle"
              className="group rounded-xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
            >
              <h2 className="font-display text-2xl text-zinc-900">Raffle Draw</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Spin a fair prize wheel with quantity limits.
              </p>
              <span className="mt-5 inline-flex rounded-md bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                Open raffle
              </span>
            </Link>
          </div>
        </div>
      ) : sessionState.phase === "idle" ? (
        setupPageContent
      ) : (
        <LiveSession
          state={sessionState}
          config={
            sessionConfig ?? {
              ...DEFAULT_SETUP,
              workVolume: WORK_VOLUME,
              restVolume: REST_VOLUME,
            }
          }
          spotifyStatus={spotifyStatus}
          nowPlaying={nowPlaying}
          onEndSession={endSession}
          onResumeNextPass={() => void resumeNextPass()}
          onGoHome={() => {
            coachRef.current.disconnect();
            setEntryPoint("launcher");
          }}
        />
      )}
    </div>
  );
}
