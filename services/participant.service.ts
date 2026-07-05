import {
  addParticipantRequestSchema,
  normalizeParticipantRow,
  participantRowSchema,
  participantRowToConnectedPlayer,
  participantsListResponseSchema,
  parseDashboardApi,
  type ConnectedPlayer,
  type SessionParticipant,
} from "@/lib/api/dashboard/schemas";
import { ApiError, apiRequest } from "@/services/api-client";

/** Cached after the first missing-route response — this route is optional on older backends. */
let participantsListAvailable: boolean | null = null;

function isParticipantsRouteUnavailable(error: unknown) {
  return error instanceof ApiError && (error.status === 404 || error.status === 500);
}

async function fetchParticipantsResponse(sessionId: string) {
  if (participantsListAvailable === false) {
    return null;
  }

  try {
    const response = await apiRequest(
      `/dashboard/sessions/${sessionId}/participants`,
      undefined,
      participantsListResponseSchema
    );
    participantsListAvailable = true;
    return response;
  } catch (error) {
    if (isParticipantsRouteUnavailable(error)) {
      participantsListAvailable = false;
      return null;
    }
    throw error;
  }
}

export const participantService = {
  /** Whether GET /participants has responded successfully at least once this session. */
  isParticipantsListSupported() {
    return participantsListAvailable !== false;
  },

  async fetchParticipants(sessionId: string): Promise<SessionParticipant[]> {
    const response = await fetchParticipantsResponse(sessionId);
    if (!response) return [];

    return response.participants.map((row) => normalizeParticipantRow(row));
  },

  async fetchJoinedParticipants(sessionId: string): Promise<ConnectedPlayer[]> {
    const response = await fetchParticipantsResponse(sessionId);
    if (!response) return [];

    return response.participants.map((row) => participantRowToConnectedPlayer(row));
  },

  async addParticipant(
    sessionId: string,
    body: {
      playerName: string;
      playerId?: string;
    }
  ) {
    const payload = parseDashboardApi(addParticipantRequestSchema, body, "add participant request");
    return apiRequest(`/dashboard/sessions/${sessionId}/participants`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, participantRowSchema);
  },

  async removeParticipant(sessionId: string, playerId: string) {
    await apiRequest(`/sessions/${sessionId}/leave`, {
      method: "DELETE",
      body: JSON.stringify({ playerId }),
    });
  },
};
