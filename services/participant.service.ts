import {
  normalizeParticipantRow,
  participantRowToConnectedPlayer,
  participantsListResponseSchema,
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

    return response.participants
      .map((row) => participantRowToConnectedPlayer(row))
      .filter((player): player is ConnectedPlayer => player !== null);
  },
};
