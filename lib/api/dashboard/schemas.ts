import { z } from "zod";
import {
  normalizeConnectedPlayer,
  normalizeDashboardPayload,
  normalizePresencePayload,
  normalizeRealtimePayload,
} from "@/lib/api/dashboard/normalizeRealtime";

/** Matches the NOTA game engine dashboard + realtime contract. */

export const apiSessionStatusSchema = z.enum([
  "active",
  "paused",
  "pass_break",
  "ended",
]);

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

export const sessionStatePatchSchema = z.object({
  status: apiSessionStatusSchema,
});

export const sessionStateResponseSchema = z.object({
  id: z.string().min(1),
  status: apiSessionStatusSchema,
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
});

export const leaderboardEntrySchema = z.object({
  rank: z.number().int(),
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  teamId: z.string().nullable(),
  teamName: z.string().nullable(),
  duoId: z.string().nullable(),
  duoName: z.string().nullable(),
  totalXp: z.number(),
  overallRank: z.number().int(),
  duoTotalXp: z.number().optional(),
  duoRank: z.number().int().nullable().optional(),
  passXp: z.number(),
  currentPassRank: z.number().int().nullable(),
});

export const leaderboardResponseSchema = z.object({
  sessionId: z.string().min(1),
  pass: z.number().int().nullable(),
  updatedAt: z.number(),
  entries: z.array(leaderboardEntrySchema),
});

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
    duoId: z.string().nullable().optional().default(null),
    joinedAt: timestampSchema.optional().default(0),
  })
);

export const sessionStateChangePayloadSchema = z.preprocess(
  normalizeRealtimePayload,
  z.object({
    sessionId: z.string().min(1),
    status: apiSessionStatusSchema,
    timestamp: timestampSchema.optional().default(0),
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
  duoId: z.string().nullable().optional().default(null),
  duoName: z.string().nullable().optional(),
  joinedAt: z.string().nullable().optional(),
  teams: z.object({ name: z.string() }).optional().nullable(),
  duos: z.object({ name: z.string() }).optional().nullable(),
});

export const participantsListResponseSchema = z.preprocess(
  normalizeDashboardPayload,
  z.object({
    sessionId: z.string().min(1).optional(),
    participants: z.array(participantRowSchema),
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
): ConnectedPlayer | null {
  if (!row.joinedAt) return null;

  const joinedAt = Date.parse(row.joinedAt);
  if (Number.isNaN(joinedAt)) return null;

  return {
    playerId: row.playerId,
    playerName: row.playerName,
    teamId: row.teamId ?? null,
    duoId: row.duoId ?? null,
    joinedAt,
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
    duoId: null,
    duoName: null,
    totalXp: entry.totalXp,
    overallRank: entry.rank,
    passXp: 0,
    currentPassRank: null,
  };
}
