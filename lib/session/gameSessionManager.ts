import { toBackendSessionConfig } from "@/lib/api/dashboard/sessionConfig";
import type { SessionStateChangePayload } from "@/lib/api/dashboard/schemas";
import { CURRENT_EVENT } from "@/lib/config/event";
import { isNotaApiConfigured } from "@/lib/config/api";
import type { GameStatePayload } from "@/lib/gameState/types";
import {
  configureGameStateSync,
  queueGameStateSync,
  resetGameStateSync,
  syncGameStateImmediate,
} from "@/lib/session/gameStateSync";
import { storeStatusFromBackendState, toBackendStatePatch } from "@/lib/session/backendGameState";
import { participantService } from "@/services/participant.service";
import { leaderboardService } from "@/services/leaderboard.service";
import { sessionService } from "@/services/session.service";
import { sessionStore } from "@/stores/sessionStore";
import type { SessionConfig } from "@/types/session";
import type { SessionStatePatch } from "@/lib/api/dashboard/schemas";
import {
  hasPlayersMissingTeamRegistry,
  participantsToTeamLookup,
} from "@/lib/session/playerTeams";
import type { ConnectedPlayer } from "@/types/session-api";

type RemoteGameStateEvent = SessionStateChangePayload & {
  fromPatchResponse?: boolean;
};

type RemoteGameStateListener = (event: RemoteGameStateEvent) => void;

let remoteGameStateListener: RemoteGameStateListener | null = null;

function patchResponseGameState(
  response: Awaited<ReturnType<typeof sessionService.patchState>> | undefined
) {
  if (!response || !("gameState" in response)) return null;
  return response.gameState ?? null;
}

configureGameStateSync(async (sessionId, patch) => {
  const response = await sessionService.patchState(sessionId, patch);
  updateStoreStatusFromPatch(patch);
  const gameState = patchResponseGameState(response);
  if (gameState) {
    applyRemoteGameStatePayload(gameState, { fromPatchResponse: true });
  }
});

function updateStoreStatusFromPatch(patch: SessionStatePatch) {
  if (patch.status === "ended") {
    sessionStore.setStatus("ended");
    return;
  }
  if (patch.status === "paused") {
    sessionStore.setStatus("paused");
    return;
  }
  if (patch.status === "active") {
    sessionStore.setStatus("active");
  }
}

function applyRemoteGameStatePayload(
  payload: SessionStateChangePayload,
  options: { fromPatchResponse?: boolean } = {}
) {
  sessionStore.setStatus(storeStatusFromBackendState(payload.state));
  sessionStore.setRemoteGameState(payload.state);
  remoteGameStateListener?.({ ...payload, fromPatchResponse: options.fromPatchResponse });
}

/**
 * Conductor for backend session lifecycle. The workout clock stays in
 * SessionControllerContext; this layer issues REST commands and
 * keeps the session store aligned with backend events.
 */
export const gameSessionManager = {
  isEnabled() {
    return isNotaApiConfigured();
  },

  onRemoteGameState(listener: RemoteGameStateListener | null) {
    remoteGameStateListener = listener;
    return () => {
      if (remoteGameStateListener === listener) {
        remoteGameStateListener = null;
      }
    };
  },

  async createSession(config: SessionConfig) {
    if (!isNotaApiConfigured()) return;

    try {
      const session = await sessionService.createSession({
        title: CURRENT_EVENT.name,
        teamFormat: "team",
        config: toBackendSessionConfig(config),
      });

      sessionStore.setSessionId(session.id);
      sessionStore.setStatus("draft");
    } catch (error) {
      console.warn("Failed to create backend session", error);
      throw error;
    }
  },

  async disconnectSession() {
    const { sessionId, status } = sessionStore.getState();

    if (sessionId && isNotaApiConfigured() && status !== "ended") {
      try {
        const response = await sessionService.patchState(sessionId, { status: "ended" });
        const gameState = patchResponseGameState(response);
        if (gameState) {
          applyRemoteGameStatePayload(gameState);
        }
      } catch (error) {
        console.warn("Failed to end backend session", error);
        throw error;
      }
    }

    resetGameStateSync();
    sessionStore.reset();
  },

  async ensureSessionActive() {
    const { sessionId, status } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured() || status === "active" || status === "ended") {
      return;
    }

    await sessionService.patchState(sessionId, { status: "active" });
    sessionStore.setStatus("active");
  },

  syncGameState(payload: GameStatePayload) {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    const patch = toBackendStatePatch(payload);
    if (!patch) return;

    queueGameStateSync(sessionId, payload);
  },

  async syncGameStateNow(payload: GameStatePayload) {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    await syncGameStateImmediate(sessionId, payload);
  },

  applyRemoteGameState(payload: SessionStateChangePayload) {
    applyRemoteGameStatePayload(payload);
  },

  async end() {
    const { sessionId, status } = sessionStore.getState();
    if (status === "ended") return;

    if (!sessionId || !isNotaApiConfigured()) {
      sessionStore.setStatus("ended");
      return;
    }

    try {
      const response = await sessionService.patchState(sessionId, { status: "ended" });
      sessionStore.setStatus("ended");
      const gameState = patchResponseGameState(response);
      if (gameState) {
        applyRemoteGameStatePayload(gameState);
      }
    } catch (error) {
      console.warn("Failed to end backend session", error);
    }
  },

  reset() {
    resetGameStateSync();
    sessionStore.reset();
  },

  async refreshLeaderboard() {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    try {
      const leaderboard = await leaderboardService.fetchLeaderboard(sessionId);
      sessionStore.setLeaderboard(leaderboard);
    } catch (error) {
      console.warn("Failed to refresh leaderboard", error);
    }
  },

  /** Load team names from GET /participants (handoff: resolved Red/Blue via teams.name). */
  async refreshParticipantTeams() {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    try {
      const participants = await participantService.fetchParticipants(sessionId);
      sessionStore.mergePlayerTeams(participantsToTeamLookup(participants));
    } catch (error) {
      console.warn("Failed to refresh participant teams", error);
    }
  },

  async refreshParticipantTeamsIfNeeded(connectedPlayers: ConnectedPlayer[]) {
    const { playerTeams } = sessionStore.getState();
    if (!hasPlayersMissingTeamRegistry(connectedPlayers, playerTeams)) {
      return;
    }

    await this.refreshParticipantTeams();
  },

  async removePlayerFromSession(playerId: string) {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) {
      throw new Error("No active session");
    }

    await participantService.removeParticipant(sessionId, playerId);
    sessionStore.removeConnectedPlayer(playerId);
    void this.refreshLeaderboard();
  },
};

export type { RemoteGameStateEvent, RemoteGameStateListener };
