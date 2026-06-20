import { create } from "zustand";
import type { LeaderboardEntry } from "@/types/leaderboard";
import type { ConnectedPlayer, SessionStatus } from "@/types/session-api";

export type RealtimeChannelStatus = "idle" | "connecting" | "subscribed" | "error";

type SessionStore = {
  sessionId?: string;
  status: SessionStatus;
  connectedPlayers: ConnectedPlayer[];
  leaderboard: LeaderboardEntry[];
  realtimeScoresStatus: RealtimeChannelStatus;
  lastPresenceAt?: number;
  setSessionId: (sessionId: string | undefined) => void;
  setStatus: (status: SessionStatus) => void;
  setConnectedPlayers: (players: ConnectedPlayer[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setRealtimeScoresStatus: (status: RealtimeChannelStatus) => void;
  touchPresence: () => void;
  reset: () => void;
};

const SESSION_STORAGE_KEY = "nota_active_session_id";

function readPersistedSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return sessionStorage.getItem(SESSION_STORAGE_KEY) ?? undefined;
}

function persistSessionId(sessionId: string | undefined) {
  if (typeof window === "undefined") return;
  if (sessionId) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

const INITIAL_STATE = {
  sessionId: undefined as string | undefined,
  status: "draft" as SessionStatus,
  connectedPlayers: [] as ConnectedPlayer[],
  leaderboard: [] as LeaderboardEntry[],
  realtimeScoresStatus: "idle" as RealtimeChannelStatus,
  lastPresenceAt: undefined as number | undefined,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...INITIAL_STATE,
  setSessionId: (sessionId) => {
    persistSessionId(sessionId);
    set({ sessionId });
  },
  setStatus: (status) => set({ status }),
  setConnectedPlayers: (connectedPlayers) => set({ connectedPlayers }),
  setLeaderboard: (leaderboard) => set({ leaderboard: leaderboard ?? [] }),
  setRealtimeScoresStatus: (realtimeScoresStatus) => set({ realtimeScoresStatus }),
  touchPresence: () => set({ lastPresenceAt: Date.now() }),
  reset: () => {
    persistSessionId(undefined);
    set(INITIAL_STATE);
  },
}));

/** Non-React access for orchestration outside components. */
export const sessionStore = {
  getState: () => useSessionStore.getState(),
  setSessionId: (sessionId: string | undefined) =>
    useSessionStore.getState().setSessionId(sessionId),
  setStatus: (status: SessionStatus) => useSessionStore.getState().setStatus(status),
  setConnectedPlayers: (players: ConnectedPlayer[]) =>
    useSessionStore.getState().setConnectedPlayers(players),
  setLeaderboard: (entries: LeaderboardEntry[]) =>
    useSessionStore.getState().setLeaderboard(entries),
  setRealtimeScoresStatus: (status: RealtimeChannelStatus) =>
    useSessionStore.getState().setRealtimeScoresStatus(status),
  touchPresence: () => useSessionStore.getState().touchPresence(),
  reset: () => useSessionStore.getState().reset(),
};

/** Restore persisted session id after client mount (avoids SSR hydration mismatch). */
export function hydrateSessionStoreFromStorage() {
  const sessionId = readPersistedSessionId();
  if (sessionId && !useSessionStore.getState().sessionId) {
    useSessionStore.setState({ sessionId });
  }
}
