"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import confetti from "canvas-confetti";
import { AudioCues } from "@/lib/audio";
import { publishGameState } from "@/lib/gameState/publish";
import {
  AUTO_NEXT_THRESHOLD_MS,
  DEFAULT_SETUP,
  INITIAL_SESSION_STATE,
  NOW_PLAYING_POLL_MS,
  REST_VOLUME,
  TIMED_PHASES,
  WORK_VOLUME,
} from "@/lib/session/constants";
import {
  getPhaseDuration,
  getRestDuration,
  getTotalIntervals,
  isSpotifyPlaybackActive,
} from "@/lib/session";
import {
  spotifyService,
  type SpotifyNowPlaying,
  type SpotifyStatus,
} from "@/lib/spotify";
import type { Phase, SessionConfig, SessionState, SetupInput } from "@/types/session";

type SessionControllerContextValue = {
  setupValues: SetupInput;
  setSetupValues: (values: SetupInput) => void;
  sessionConfig: SessionConfig | null;
  sessionState: SessionState;
  spotifyStatus: SpotifyStatus;
  nowPlaying: SpotifyNowPlaying | null;
  startSession: (config: SessionConfig) => Promise<void>;
  endSession: () => void;
  goHome: () => void;
  resumeNextPass: () => Promise<void>;
  handleConnectSpotify: () => void;
  handleDisconnectSpotify: () => void;
  setSpotifyEnabled: (enabled: boolean) => Promise<void>;
  workVolume: number;
  restVolume: number;
  defaultSetup: SetupInput;
};

const SessionControllerContext = createContext<SessionControllerContextValue | null>(null);

function readSetupFromStorage(): SetupInput {
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
}

/**
 * Lives at the app root so session timers, audio, and Spotify survive
 * navigation between Controller (/), Players (/players), and Scores (/scores).
 */
export function SessionControllerProvider({ children }: { children: ReactNode }) {
  const [setupValues, setSetupValues] = useState<SetupInput>(readSetupFromStorage);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>(INITIAL_SESSION_STATE);
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
  const buzzerDriverRef = useRef<Promise<void> | null>(null);
  const buzzerStopRef = useRef(false);
  const spotifyPlayerReadyRef = useRef(false);

  useEffect(() => {
    sessionConfigRef.current = sessionConfig;
  }, [sessionConfig]);

  useEffect(() => {
    spotifyPlayerReadyRef.current = spotifyStatus.playerReady;
  }, [spotifyStatus.playerReady]);

  useEffect(() => {
    publishGameState({
      timestamp: Date.now(),
      state: sessionStateRef.current,
      config: sessionConfigRef.current,
    });
  }, []);

  const clearTicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateSessionState = useCallback((updater: (prev: SessionState) => SessionState) => {
    const next = updater(sessionStateRef.current);
    sessionStateRef.current = next;
    setSessionState(next);
    publishGameState({
      timestamp: Date.now(),
      state: next,
      config: sessionConfigRef.current,
    });
  }, []);

  const refreshSpotifyStatus = useCallback((error?: string) => {
    setSpotifyStatus({
      ...spotifyService.getStatus(),
      error,
    });
  }, []);

  const setSpotifyVolume = useCallback((volume: number) => {
    if (!isSpotifyPlaybackActive(sessionConfigRef.current)) return;
    if (spotifyService.getStatus().playerReady) {
      void spotifyService.setVolume(volume);
    }
  }, []);

  const publishCurrentState = useCallback(() => {
    publishGameState({
      timestamp: Date.now(),
      state: sessionStateRef.current,
      config: sessionConfigRef.current,
    });
  }, []);

  const setSpotifyEnabled = useCallback(
    async (enabled: boolean) => {
      const config = sessionConfigRef.current;
      if (!config || config.spotifyEnabled === enabled) return;

      const nextConfig = { ...config, spotifyEnabled: enabled };
      sessionConfigRef.current = nextConfig;
      setSessionConfig(nextConfig);
      const nextSetup: SetupInput = {
        workTime: config.workTime,
        restTime: config.restTime,
        restBetweenStationsTime: config.restBetweenStationsTime,
        roundsPerStation: config.roundsPerStation,
        stations: config.stations,
        fullSessionPasses: config.fullSessionPasses,
        maxTrackPlaySeconds: config.maxTrackPlaySeconds,
        spotifyPlaylistUri: config.spotifyPlaylistUri,
        spotifyEnabled: enabled,
      };
      setSetupValues(nextSetup);
      localStorage.setItem("nota_class_controller_setup", JSON.stringify(nextSetup));
      publishCurrentState();

      if (!enabled) {
        await spotifyService.pause(spotifyService.getStatus().deviceId);
        setNowPlaying(null);
        return;
      }

      if (!isSpotifyPlaybackActive(nextConfig) || !spotifyPlayerReadyRef.current) return;

      const { phase } = sessionStateRef.current;
      const volume = phase === "work" ? nextConfig.workVolume : nextConfig.restVolume;
      const deviceId = spotifyService.getStatus().deviceId;
      await spotifyService.setShuffle(true, deviceId);
      await spotifyService.playPlaylist(nextConfig.spotifyPlaylistUri);
      setSpotifyVolume(volume);
    },
    [publishCurrentState, setSpotifyVolume]
  );

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
        audioCuesRef.current.setCueVolume(config.workVolume);
        void audioCuesRef.current.play("sessionComplete");
      } else {
        audioCuesRef.current.stopAll();
      }
    },
    [clearTicker, setSpotifyVolume, updateSessionState]
  );

  const advancePhase = useCallback(async () => {
    if (advancingRef.current) return;
    const config = sessionConfigRef.current;
    if (!config) return;

    advancingRef.current = true;
    phaseEndTimeRef.current = null;
    try {
      const current = sessionStateRef.current;

      const finishedTimedPhase = TIMED_PHASES.includes(
        current.phase as (typeof TIMED_PHASES)[number]
      );
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
        const duration = durationOverride ?? getPhaseDuration(phase, config);
        phaseEndTimeRef.current = duration > 0 ? Date.now() + duration * 1000 : null;

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
        await audioCuesRef.current.playAndWait("passTransition");
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
        const restCue = transitionsToNextStation ? "switchStation" : "rest";
        audioCuesRef.current.play(restCue);
        setSpotifyVolume(config.restVolume);
        commitPhase(
          "rest",
          current.currentStation,
          current.currentRound,
          completedIntervals,
          transitionsToNextStation ? getRestDuration(config, true) : undefined
        );
        buzzerStopRef.current = false;
        buzzerDriverRef.current = (async () => {
          await audioCuesRef.current.waitForCueToFinish(restCue);
          let plays = 0;
          while (!buzzerStopRef.current || plays < 3) {
            if (sessionStateRef.current.phase !== "rest") break;
            await audioCuesRef.current.playAndWait("buzzer");
            plays += 1;
          }
        })();
        return;
      }

      if (current.phase === "rest") {
        buzzerStopRef.current = true;
        await buzzerDriverRef.current;

        if (current.currentRound < config.roundsPerStation) {
          setSpotifyVolume(config.workVolume);
          await audioCuesRef.current.playAndWait("airHorn");
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
          await audioCuesRef.current.playAndWait("airHorn");
          commitPhase("work", current.currentStation + 1, 1, completedIntervals);
          return;
        }

        if (current.currentPass < config.fullSessionPasses) {
          await beginNextPassTransition(completedIntervals);
          return;
        }

        markComplete();
      }
    } finally {
      advancingRef.current = false;
    }
  }, [celebrateStationComplete, clearTicker, markComplete, setSpotifyVolume, updateSessionState]);

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
          audioCuesRef.current.play("tenSecondsLeft");
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
      sessionConfigRef.current = config;
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

      setSpotifyVolume(config.workVolume);
      if (isSpotifyPlaybackActive(config) && spotifyPlayerReadyRef.current) {
        const deviceId = spotifyService.getStatus().deviceId;
        await spotifyService.setShuffle(true, deviceId);
        await spotifyService.playPlaylist(config.spotifyPlaylistUri);
      }
      await audioCuesRef.current.playAndWait("airHorn");

      phaseEndTimeRef.current = Date.now() + firstWorkSeconds * 1000;
      updateSessionState((prev) => ({
        ...prev,
        isRunning: true,
        startedAtMs: Date.now(),
        endedAtMs: undefined,
      }));
      startTicker();
    },
    [setSpotifyVolume, startTicker, updateSessionState]
  );

  const endSession = useCallback(() => {
    markComplete({ playOutro: false });
  }, [markComplete]);

  const goHome = useCallback(() => {
    clearTicker();
    phaseEndTimeRef.current = null;
    audioCuesRef.current.stopAll();
    updateSessionState(() => INITIAL_SESSION_STATE);
  }, [clearTicker, updateSessionState]);

  const resumeNextPass = useCallback(async () => {
    const config = sessionConfigRef.current;
    const current = sessionStateRef.current;
    if (!config || current.phase !== "passBreak" || !current.isPaused || advancingRef.current) {
      return;
    }

    advancingRef.current = true;
    try {
      setSpotifyVolume(config.workVolume);
      await audioCuesRef.current.playAndWait("airHorn");
      const workDuration = getPhaseDuration("work", config);
      phaseEndTimeRef.current = workDuration > 0 ? Date.now() + workDuration * 1000 : null;
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
      spotifyStatus.authenticated &&
      isSpotifyPlaybackActive(sessionConfigRef.current) &&
      sessionState.phase !== "idle";
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

  const value: SessionControllerContextValue = {
    setupValues,
    setSetupValues,
    sessionConfig,
    sessionState,
    spotifyStatus,
    nowPlaying,
    startSession,
    endSession,
    goHome,
    resumeNextPass,
    handleConnectSpotify,
    handleDisconnectSpotify,
    setSpotifyEnabled,
    workVolume: WORK_VOLUME,
    restVolume: REST_VOLUME,
    defaultSetup: DEFAULT_SETUP,
  };

  return (
    <SessionControllerContext.Provider value={value}>{children}</SessionControllerContext.Provider>
  );
}

export function useSessionController() {
  const value = useContext(SessionControllerContext);
  if (!value) {
    throw new Error("useSessionController must be used within SessionControllerProvider");
  }
  return value;
}
