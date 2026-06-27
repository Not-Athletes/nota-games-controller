import { apiRequest } from "@/services/api-client";
import {
  createSessionRequestSchema,
  parseDashboardApi,
  sessionRecordSchema,
  sessionStatePatchResponseSchema,
  sessionStatePatchSchema,
  type CreateSessionRequest,
  type SessionStatePatch,
  type SessionStatePatchResponse,
} from "@/lib/api/dashboard/schemas";

export const sessionService = {
  createSession(body: CreateSessionRequest) {
    const payload = parseDashboardApi(createSessionRequestSchema, body, "create session request");
    return apiRequest("/dashboard/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }, sessionRecordSchema);
  },

  patchState(sessionId: string, patch: SessionStatePatch) {
    const payload = parseDashboardApi(sessionStatePatchSchema, patch, "session state patch");
    return apiRequest<SessionStatePatchResponse>(
      `/dashboard/sessions/${sessionId}/state`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      sessionStatePatchResponseSchema
    );
  },
};
