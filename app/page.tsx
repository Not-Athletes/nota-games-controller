"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveSession } from "@/components/LiveSession";
import { SetupForm } from "@/components/SetupForm";
import { SpotifyConnect } from "@/components/SpotifyConnect";
import { AudioCues } from "@/lib/audio";
import { getPhaseDuration, getTotalIntervals } from "@/lib/session";
import {
  spotifyService,
  type SpotifyNowPlaying,
  type SpotifyStatus,
} from "@/lib/spotify";
import type { Phase, SessionConfig, SessionState, SetupInput } from "@/types/session";

const DEFAULT_SETUP: SetupInput = {
  attendees: 12,
  workTime: 45,
  restTime: 15,
  roundsPerStation: 3,
  stations: 6,
  spotifyPlaylistUri: "",
  workVolume: 100,
  restVolume: 35,
  cueVolume: 100,
};

const INITIAL_STATE: SessionState = {
  phase: "idle",
  currentStation: 1,
  currentRound: 1,
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
const INTRO_PRESTART_MS = 800;

export default function Home() {
  const [setupValues, setSetupValues] = useState<SetupInput>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SETUP;
    }

    try {
      const raw = localStorage.getItem("nota_class_controller_setup");
      if (!raw) return DEFAULT_SETUP;
      const stored = JSON.parse(raw) as Partial<SetupInput>;
      return {
        ...DEFAULT_SETUP,
        ...stored,
        workVolume: DEFAULT_SETUP.workVolume,
        restVolume: DEFAULT_SETUP.restVolume,
        cueVolume: DEFAULT_SETUP.cueVolume,
      };
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

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

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
      setSessionState((prev) => {
        const next = updater(prev);
        sessionStateRef.current = next;
        return next;
      });
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

  const markComplete = useCallback(() => {
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

    audioCuesRef.current.setCueVolume(config.cueVolume);
    audioCuesRef.current.stop("rest");
    setSpotifyVolume(config.restVolume);
    void audioCuesRef.current.play("sessionComplete");

  }, [clearTicker, setSpotifyVolume, updateSessionState]);

  const advancePhase = useCallback(() => {
    if (advancingRef.current) return;
    const config = sessionConfigRef.current;
    if (!config) return;

    advancingRef.current = true;
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
        completed: number
      ) => {
        const duration = getPhaseDuration(phase, config);
        phaseEndTimeRef.current =
          duration > 0 ? Date.now() + duration * 1000 : null;

        updateSessionState((prev) => ({
          ...prev,
          phase,
          currentStation: nextStation,
          currentRound: nextRound,
          timeRemaining: duration,
          isRunning: phase !== "complete" && phase !== "idle" && phase !== "paused",
          isPaused: phase === "paused",
          completedIntervals: completed,
        }));
      };

      if (current.phase === "get_ready") {
        audioCuesRef.current.stop("rest");
        audioCuesRef.current.play("workStart");
        setSpotifyVolume(config.workVolume);
        commitPhase("work", 1, 1, completedIntervals);
        return;
      }

      if (current.phase === "work") {
        const isFinalWorkInterval =
          current.currentStation === config.stations &&
          current.currentRound === config.roundsPerStation;
        if (isFinalWorkInterval) {
          markComplete();
          return;
        }

        audioCuesRef.current.play("rest");
        setSpotifyVolume(config.restVolume);
        commitPhase(
          "rest",
          current.currentStation,
          current.currentRound,
          completedIntervals
        );
        return;
      }

      if (current.phase === "rest") {
        if (current.currentRound < config.roundsPerStation) {
          audioCuesRef.current.stop("rest");
          audioCuesRef.current.play("nextRound");
          setSpotifyVolume(config.workVolume);
          audioCuesRef.current.play("airHorn");
          commitPhase(
            "work",
            current.currentStation,
            current.currentRound + 1,
            completedIntervals
          );
          return;
        }

        if (current.currentStation < config.stations) {
          audioCuesRef.current.stop("rest");
          audioCuesRef.current.play("rotateStations");
          audioCuesRef.current.play("workStart");
          setSpotifyVolume(config.workVolume);
          audioCuesRef.current.play("airHorn");
          commitPhase(
            "work",
            current.currentStation + 1,
            1,
            completedIntervals
          );
          return;
        }

        markComplete();
        return;
      }

      if (current.phase === "rotate") {
        audioCuesRef.current.stop("rest");
        audioCuesRef.current.play("workStart");
        setSpotifyVolume(config.workVolume);
        commitPhase("work", current.currentStation + 1, 1, completedIntervals);
        return;
      }
    } finally {
      advancingRef.current = false;
    }
  }, [markComplete, setSpotifyVolume, updateSessionState]);

  const startTicker = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const phaseEnd = phaseEndTimeRef.current;
      if (!phaseEnd) return;

      const millisecondsLeft = phaseEnd - Date.now();
      const nextSeconds = Math.max(0, Math.ceil(millisecondsLeft / 1000));
      if (nextSeconds !== sessionStateRef.current.timeRemaining) {
        updateSessionState((prev) => ({ ...prev, timeRemaining: nextSeconds }));
      }

      if (millisecondsLeft <= 0) {
        advancePhase();
      }
    }, 250);
  }, [advancePhase, updateSessionState]);

  const startSession = useCallback(
    async (config: SessionConfig) => {
      setSessionConfig(config);
      audioCuesRef.current.setCueVolume(config.cueVolume);
      audioCuesRef.current.stopAll();

      const totalIntervals = getTotalIntervals(config);
      const firstWorkSeconds = getPhaseDuration("work", config);
      updateSessionState(() => ({
        phase: "work",
        currentStation: 1,
        currentRound: 1,
        timeRemaining: firstWorkSeconds,
        isRunning: false,
        isPaused: false,
        completedIntervals: 0,
        totalIntervals,
        startedAtMs: undefined,
        endedAtMs: undefined,
      }));

      if (spotifyStatus.playerReady) {
        await audioCuesRef.current.playAndTriggerNearEnd(
          "intro",
          INTRO_PRESTART_MS,
          async () => {
            audioCuesRef.current.play("airHorn");
            if (config.spotifyPlaylistUri) {
              await spotifyService.playPlaylist(config.spotifyPlaylistUri);
            }
            setSpotifyVolume(config.workVolume);
          }
        );
      } else {
        await audioCuesRef.current.playAndWait("intro");
      }

      phaseEndTimeRef.current = Date.now() + firstWorkSeconds * 1000;
      updateSessionState((prev) => ({
        ...prev,
        isRunning: true,
        isPaused: false,
        startedAtMs: Date.now(),
        endedAtMs: undefined,
      }));
      startTicker();
    },
    [setSpotifyVolume, spotifyStatus.playerReady, startTicker, updateSessionState]
  );

  const endSession = useCallback(() => {
    markComplete();
  }, [markComplete]);

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
    const isSessionActive =
      sessionState.phase !== "idle" &&
      sessionState.phase !== "complete" &&
      sessionState.isRunning;

    if (!isSessionActive || !spotifyStatus.authenticated) {
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

      if (!track?.isPlaying || !track.durationMs || track.progressMs === undefined) {
        return;
      }

      const trackKey = `${track.trackName}::${track.artistName}::${track.durationMs}`;
      if (autoNextHandledTrackRef.current !== trackKey) {
        autoNextHandledTrackRef.current = null;
      }

      const remainingMs = track.durationMs - track.progressMs;
      if (
        remainingMs > 0 &&
        remainingMs <= AUTO_NEXT_THRESHOLD_MS &&
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
          <h1 className="font-brand text-lg font-bold tracking-[0.06em] text-zinc-600 md:text-xl">
            Not Athletes Games
          </h1>
        </header>

        <SpotifyConnect
          status={spotifyStatus}
          onConnect={handleConnectSpotify}
          onDisconnect={handleDisconnectSpotify}
        />

        <SetupForm
          initialValues={setupValues}
          onStart={(config) => {
            setSetupValues(config);
            localStorage.setItem("nota_class_controller_setup", JSON.stringify(config));
            void startSession(config);
          }}
        />
      </div>
    ),
    [
      handleConnectSpotify,
      handleDisconnectSpotify,
      setupValues,
      spotifyStatus,
      startSession,
    ]
  );

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      {sessionState.phase === "idle" ? (
        setupPageContent
      ) : (
        <LiveSession
          state={sessionState}
          config={sessionConfig ?? DEFAULT_SETUP}
          spotifyStatus={spotifyStatus}
          nowPlaying={nowPlaying}
          onEndSession={endSession}
        />
      )}
    </div>
  );
}
