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
import { publishGameState } from "@/lib/gameState/publish";
import { toPublishedConfig, withActivePass } from "@/lib/session/config";
import { gameSessionManager } from "@/lib/session/gameSessionManager";
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

    if (!Array.isArray(rest.passes) || rest.passes.length < 1) {
      return DEFAULT_SETUP;
    }

    return {
      ...DEFAULT_SETUP,
      ...rest,
      passes: rest.passes,
    };
  } catch {
    return DEFAULT_SETUP;
  }
}

function publishSnapshot(state: SessionState, config: SessionConfig | null) {
  publishGameState({
    timestamp: Date.now(),
    state,
    config: config ? toPublishedConfig(config) : null,
  });
}

/**
 * Lives at the app root so session timers and Spotify survive in-app updates.
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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseEndTimeRef = useRef<number | null>(null);
  const advancingRef = useRef(false);
  const sessionStateRef = useRef(sessionState);
  const sessionConfigRef = useRef<SessionConfig | null>(sessionConfig);
  const autoNextHandledTrackRef = useRef<string | null>(null);
  const workVolumeDuckedForRef = useRef<string | null>(null);
  const spotifyPlayerReadyRef = useRef(false);

  useEffect(() => {
    sessionConfigRef.current = sessionConfig;
  }, [sessionConfig]);

  useEffect(() => {
    spotifyPlayerReadyRef.current = spotifyStatus.playerReady;
  }, [spotifyStatus.playerReady]);

  useEffect(() => {
    publishSnapshot(sessionStateRef.current, sessionConfigRef.current);
  }, []);

  const clearTicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateSessionState = useCallback(
    (updater: (prev: SessionState) => SessionState, options?: { sync?: boolean }) => {
      const next = updater(sessionStateRef.current);
      sessionStateRef.current = next;
      setSessionState(next);
      if (options?.sync !== false) {
        publishSnapshot(next, sessionConfigRef.current);
      }
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
    if (!isSpotifyPlaybackActive(sessionConfigRef.current)) return;
    if (spotifyService.getStatus().playerReady) {
      void spotifyService.setVolume(volume);
    }
  }, []);

  const publishCurrentState = useCallback(() => {
    publishSnapshot(sessionStateRef.current, sessionConfigRef.current);
  }, []);

  const setSpotifyEnabled = useCallback(
    async (enabled: boolean) => {
      const config = sessionConfigRef.current;
      if (!config || config.spotifyEnabled === enabled) return;

      const nextConfig = { ...config, spotifyEnabled: enabled };
      sessionConfigRef.current = nextConfig;
      setSessionConfig(nextConfig);
      const nextSetup: SetupInput = {
        passes: config.passes,
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

  const markComplete = useCallback(
    ({ syncBackend = true }: { syncBackend?: boolean } = {}) => {
      const config = sessionConfigRef.current;
      if (!config) return;

      clearTicker();
      phaseEndTimeRef.current = null;
      workVolumeDuckedForRef.current = null;
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

      if (syncBackend) {
        void gameSessionManager.end();
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
    workVolumeDuckedForRef.current = null;
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

      const beginNextPassTransition = (completed: number) => {
        clearTicker();
        setSpotifyVolume(config.restVolume);
        phaseEndTimeRef.current = null;
        const nextPassNumber = current.currentPass + 1;
        const nextConfig = withActivePass(config, nextPassNumber);
        sessionConfigRef.current = nextConfig;
        setSessionConfig(nextConfig);
        updateSessionState((prev) => ({
          ...prev,
          phase: "passBreak",
          currentStation: 1,
          currentRound: 1,
          timeRemaining: 0,
          isRunning: false,
          isPaused: true,
          completedIntervals: completed,
          currentPass: nextPassNumber,
        }));
      };

      if (current.phase === "work") {
        const isFinalWorkInterval =
          current.currentStation === config.stations &&
          current.currentRound === config.roundsPerStation;
        if (isFinalWorkInterval) {
          if (current.currentPass < config.totalPasses) {
            beginNextPassTransition(completedIntervals);
            return;
          }
          markComplete();
          return;
        }

        const transitionsToNextStation =
          current.currentRound === config.roundsPerStation &&
          current.currentStation < config.stations;
        setSpotifyVolume(config.restVolume);
        commitPhase(
          "rest",
          current.currentStation,
          current.currentRound,
          completedIntervals,
          transitionsToNextStation ? getRestDuration(config, true) : undefined
        );
        return;
      }

      if (current.phase === "rest") {
        if (current.currentRound < config.roundsPerStation) {
          setSpotifyVolume(config.workVolume);
          commitPhase(
            "work",
            current.currentStation,
            current.currentRound + 1,
            completedIntervals
          );
          return;
        }

        if (current.currentStation < config.stations) {
          setSpotifyVolume(config.workVolume);
          commitPhase("work", current.currentStation + 1, 1, completedIntervals);
          return;
        }

        if (current.currentPass < config.totalPasses) {
          beginNextPassTransition(completedIntervals);
          return;
        }

        markComplete();
      }
    } finally {
      advancingRef.current = false;
    }
  }, [clearTicker, markComplete, setSpotifyVolume, updateSessionState]);

  const startTicker = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const config = sessionConfigRef.current;
      const current = sessionStateRef.current;
      let phaseEnd = phaseEndTimeRef.current;

      if (!phaseEnd) {
        if (
          config &&
          current.isRunning &&
          !current.isPaused &&
          TIMED_PHASES.includes(current.phase as (typeof TIMED_PHASES)[number])
        ) {
          if (current.timeRemaining > 0) {
            phaseEndTimeRef.current = Date.now() + current.timeRemaining * 1000;
            phaseEnd = phaseEndTimeRef.current;
          } else {
            void advancePhase();
            return;
          }
        } else {
          return;
        }
      }

      const millisecondsLeft = phaseEnd - Date.now();
      const nextSeconds = Math.max(0, Math.ceil(millisecondsLeft / 1000));
      const warningThreshold = Math.max(1, Math.min(15, config ? config.workTime - 1 : 15));

      if (config && current.phase === "work" && nextSeconds > 0) {
        const intervalKey = `${current.currentPass}-${current.currentStation}-${current.currentRound}`;
        if (nextSeconds <= warningThreshold) {
          if (workVolumeDuckedForRef.current !== intervalKey) {
            workVolumeDuckedForRef.current = intervalKey;
            setSpotifyVolume(config.restVolume);
          }
        } else if (workVolumeDuckedForRef.current === intervalKey) {
          workVolumeDuckedForRef.current = null;
          setSpotifyVolume(config.workVolume);
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

  useEffect(() => {
    return gameSessionManager.onRemoteGameState(({ state }) => {
      if (state.sessionEnded || state.phase === "complete") {
        if (sessionStateRef.current.phase !== "complete") {
          markComplete({ syncBackend: false });
        }
      }
      // Controller owns the workout clock — ignore Realtime state echoes while live.
    });
  }, [markComplete]);

  const startSession = useCallback(
    async (config: SessionConfig) => {
      sessionConfigRef.current = config;
      setSessionConfig(config);
      workVolumeDuckedForRef.current = null;

      if (gameSessionManager.isEnabled()) {
        await gameSessionManager.ensureSessionActive();
      }

      const totalIntervals = getTotalIntervals(config);
      const firstWorkSeconds = getPhaseDuration("work", config);

      setSpotifyVolume(config.workVolume);
      if (isSpotifyPlaybackActive(config) && spotifyPlayerReadyRef.current) {
        const deviceId = spotifyService.getStatus().deviceId;
        await spotifyService.setShuffle(true, deviceId);
        await spotifyService.playPlaylist(config.spotifyPlaylistUri);
      }

      phaseEndTimeRef.current = Date.now() + firstWorkSeconds * 1000;
      updateSessionState(() => ({
        phase: "work",
        currentStation: 1,
        currentRound: 1,
        currentPass: 1,
        timeRemaining: firstWorkSeconds,
        isRunning: true,
        isPaused: false,
        completedIntervals: 0,
        totalIntervals,
        startedAtMs: Date.now(),
        endedAtMs: undefined,
      }));

      if (gameSessionManager.isEnabled()) {
        await gameSessionManager.syncGameStateNow({
          timestamp: Date.now(),
          state: sessionStateRef.current,
          config: toPublishedConfig(config),
        });
      }

      startTicker();
    },
    [setSpotifyVolume, startTicker, updateSessionState]
  );

  const endSession = useCallback(() => {
    markComplete({ syncBackend: true });
  }, [markComplete]);

  const goHome = useCallback(() => {
    clearTicker();
    phaseEndTimeRef.current = null;
    workVolumeDuckedForRef.current = null;
    sessionConfigRef.current = null;
    setSessionConfig(null);
    updateSessionState(() => INITIAL_SESSION_STATE);
    gameSessionManager.reset();
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
      const workDuration = getPhaseDuration("work", config);
      phaseEndTimeRef.current = workDuration > 0 ? Date.now() + workDuration * 1000 : null;
      workVolumeDuckedForRef.current = null;
      updateSessionState((prev) => ({
        ...prev,
        phase: "work",
        currentStation: 1,
        currentRound: 1,
        timeRemaining: workDuration,
        isRunning: true,
        isPaused: false,
      }));
      if (gameSessionManager.isEnabled()) {
        await gameSessionManager.syncGameStateNow({
          timestamp: Date.now(),
          state: sessionStateRef.current,
          config: toPublishedConfig(config),
        });
      }
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
