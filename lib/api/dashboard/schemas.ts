import { z } from "zod";
import {
  normalizeConnectedPlayer,
  normalizeDashboardPayload,
  normalizePresencePayload,
  normalizeRealtimePayload,
} from "@/lib/api/dashboard/normalizeRealtime";

/** Matches the NOTA game engine dashboard + realtime contract (strict handoff). */

export const apiSessionStatusSchema = z.enum(["active", "paused", "ended"]);

/** Local-only status before the session is started on the backend. */
export const sessionStatusSchema = z.union([
  z.literal("draft"),
  apiSessionStatusSchema,
]);

export const teamFormatSchema = z.enum(["solo", "team", "mixed"]);

export const sessionConfigSchema = z.object({
  stations: z.number().int().positive(),
  roundsPerStation: z.number().int().positive(),
  fullSessionPasses: z.number().int().positive(),
  workDurationSecs: z.number().int().positive(),
  restDurationSecs: z.number().int().positive(),
});

export const createSessionRequestSchema = z.object({
  title: z.string().trim().min(1),
  teamFormat: teamFormatSchema,
  config: sessionConfigSchema,
});

export const sessionRecordSchema = z
  .object({
    id: z.string().min(1),
  })
  .passthrough();

export const backendGamePhaseSchema = z.enum(["work", "rest", "passBreak", "complete"]);

export const backendGameStateSchema = z.object({
  sensorActive: z.boolean().optional().default(false),
  sessionEnded: z.boolean().optional().default(false),
  phase: backendGamePhaseSchema,
  currentStation: z.number().int(),
  currentRound: z.number().int(),
  currentPass: z.number().int(),
  timeRemaining: z.number(),
  isRunning: z.boolean(),
  isPaused: z.boolean(),
  completedIntervals: z.number().int(),
  totalIntervals: z.number().int(),
});

export const sessionStatePatchSchema = z.object({
  status: apiSessionStatusSchema.optional(),
  phase: backendGamePhaseSchema.optional(),
  currentStation: z.number().int().optional(),
  currentRound: z.number().int().optional(),
  currentPass: z.number().int().optional(),
  timeRemaining: z.number().optional(),
  isRunning: z.boolean().optional(),
  isPaused: z.boolean().optional(),
  completedIntervals: z.number().int().optional(),
  totalIntervals: z.number().int().optional(),
});

export const sessionStateResponseSchema = z.object({
  id: z.string().min(1),
  status: apiSessionStatusSchema,
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
});

function normalizeLeaderboardResponse(payload: unknown): unknown {
  const normalized = normalizeDashboardPayload(payload);
  if (!normalized || typeof normalized !== "object") return normalized;

  const record = { ...(normalized as Record<string, unknown>) };
  if (!record.leaderboard && Array.isArray(record.entries)) {
    record.leaderboard = record.entries;
  }

  return record;
}

export const leaderboardEntrySchema = z.object({
  rank: z.number().int(),
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  teamId: z.string().nullable().optional().default(null),
  teamName: z.string().nullable().optional(),
  totalXp: z.number(),
  overallRank: z.number().int().optional(),
  passXp: z.number().optional(),
  currentPassRank: z.number().int().nullable().optional(),
});

export const leaderboardResponseSchema = z.preprocess(
  normalizeLeaderboardResponse,
  z.object({
    sessionId: z.string().min(1),
    pass: z.number().int().nullable().optional(),
    updatedAt: z.number().optional(),
    leaderboard: z.array(leaderboardEntrySchema),
  })
);

export const realtimeLeaderboardEntrySchema = z.object({
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  totalXp: z.number(),
  rank: z.number().int(),
});

export const timestampSchema = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
});

export const connectedPlayerSchema = z.preprocess(
  normalizeConnectedPlayer,
  z.object({
    playerId: z.string().min(1),
    playerName: z.string().min(1),
    teamId: z.string().nullable().optional().default(null),
    joinedAt: timestampSchema.optional().default(0),
  })
);

export const sessionStateChangePayloadSchema = z.preprocess(
  normalizeRealtimePayload,
  z.object({
    timestamp: timestampSchema.optional().default(0),
    state: backendGameStateSchema,
  })
);

export const leaderboardUpdatePayloadSchema = z.preprocess(
  normalizeRealtimePayload,
  z.object({
    sessionId: z.string().min(1),
    updatedAt: timestampSchema.optional().default(0),
    leaderboard: z.array(realtimeLeaderboardEntrySchema),
  })
);

export const presenceUpdatePayloadSchema = z.preprocess(
  normalizePresencePayload,
  z.object({
    sessionId: z.string().min(1).optional(),
    updatedAt: timestampSchema.optional().default(0),
    connectedPlayers: z.array(connectedPlayerSchema),
  })
);

export const participantRowSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  teamId: z.string().nullable().optional().default(null),
  teamName: z.string().nullable().optional(),
  joinedAt: z.string().nullable().optional(),
  teams: z.object({ name: z.string() }).optional().nullable(),
});

export const participantsListResponseSchema = z.preprocess(
  normalizeDashboardPayload,
  z.object({
    sessionId: z.string().min(1).optional(),
    participants: z.array(participantRowSchema),
  })
);

export const sessionStatePatchResponseSchema = z.preprocess(
  normalizeDashboardPayload,
  z.union([
    z.object({
      updated: z.boolean().optional(),
      gameState: sessionStateChangePayloadSchema.nullable().optional(),
    }),
    sessionStateResponseSchema,
  ])
);

export const addParticipantRequestSchema = z.object({
  playerId: z.string().min(1).optional(),
  playerName: z.string().min(1),
  teamId: z.string().nullable().optional(),
});

export const participantAssignmentSchema = z.object({
  participantId: z.string().min(1),
  teamId: z.string().nullable(),
});

export const bulkAssignParticipantsRequestSchema = z.object({
  assignments: z.array(participantAssignmentSchema).min(1),
});

export const assignParticipantsResponseSchema = z.object({
  assigned: z.number().int(),
});

export const bulkAssignParticipantsResponseSchema = z.preprocess(
  normalizeDashboardPayload,
  z.object({
    assigned: z.number().int(),
    participants: z.array(participantRowSchema),
  })
);

export const singleAssignParticipantRequestSchema = z.object({
  teamId: z.string().nullable(),
});

export const singleAssignParticipantResponseSchema = z.preprocess(
  normalizeDashboardPayload,
  z.object({
    id: z.string().min(1),
    playerId: z.string().min(1),
    playerName: z.string().min(1),
    teamId: z.string().nullable().optional().default(null),
  })
);

export const dashboardApiErrorSchema = z.object({
  error: z.string(),
  detail: z.string().optional(),
  issues: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

export type SessionStatePatch = z.infer<typeof sessionStatePatchSchema>;
export type BackendGameState = z.infer<typeof backendGameStateSchema>;
export type ApiSessionStatus = z.infer<typeof apiSessionStatusSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type TeamFormat = z.infer<typeof teamFormatSchema>;
export type BackendSessionConfig = z.infer<typeof sessionConfigSchema>;
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type SessionRecord = z.infer<typeof sessionRecordSchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type ConnectedPlayer = z.infer<typeof connectedPlayerSchema>;
export type LeaderboardUpdatePayload = z.infer<typeof leaderboardUpdatePayloadSchema>;
export type SessionStateChangePayload = z.infer<typeof sessionStateChangePayloadSchema>;
export type SessionStatePatchResponse = z.infer<typeof sessionStatePatchResponseSchema>;
export type PresenceUpdatePayload = z.infer<typeof presenceUpdatePayloadSchema>;
export type RealtimeLeaderboardEntry = z.infer<typeof realtimeLeaderboardEntrySchema>;
export type SessionParticipant = {
  id: string;
  playerId: string;
  playerName: string;
  teamName: string | null;
  joinedAt: string | null;
};

export function normalizeParticipantRow(
  row: z.infer<typeof participantRowSchema>
): SessionParticipant {
  return {
    id: row.id,
    playerId: row.playerId,
    playerName: row.playerName,
    teamName: row.teamName ?? row.teams?.name ?? null,
    joinedAt: row.joinedAt ?? null,
  };
}

export function participantRowToConnectedPlayer(
  row: z.infer<typeof participantRowSchema>
): ConnectedPlayer {
  const joinedAtMs = row.joinedAt ? Date.parse(row.joinedAt) : Date.now();

  return {
    playerId: row.playerId,
    playerName: row.playerName,
    teamId: row.teamId ?? null,
    joinedAt: Number.isNaN(joinedAtMs) ? Date.now() : joinedAtMs,
  };
}

export function mergeConnectedPlayers(
  current: ConnectedPlayer[],
  incoming: ConnectedPlayer[]
): ConnectedPlayer[] {
  const byId = new Map(current.map((player) => [player.playerId, player]));
  for (const player of incoming) {
    byId.set(player.playerId, player);
  }
  return Array.from(byId.values());
}

export function parseDashboardApi<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  label: string
): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.warn(`Dashboard API ${label} validation failed`, parsed.error.flatten());
    throw new Error(`Invalid ${label} from dashboard API`);
  }
  return parsed.data;
}

/** Map a compact realtime leaderboard row to the richer REST entry shape. */
export function realtimeEntryToLeaderboardEntry(
  entry: RealtimeLeaderboardEntry
): LeaderboardEntry {
  return {
    rank: entry.rank,
    playerId: entry.playerId,
    playerName: entry.playerName,
    teamId: null,
    teamName: null,
    totalXp: entry.totalXp,
    overallRank: entry.rank,
    passXp: 0,
    currentPassRank: null,
  };
}
