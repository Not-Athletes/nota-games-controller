/** Normalize Supabase broadcast / backend payloads before Zod parsing. */

export function unwrapBroadcastPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;

  const record = payload as Record<string, unknown>;
  if ("payload" in record && record.payload && typeof record.payload === "object") {
    const keys = Object.keys(record);
    if (keys.length === 1 || "event" in record || "type" in record) {
      return unwrapBroadcastPayload(record.payload);
    }
  }

  return payload;
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function normalizeKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeKeysDeep);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(record)) {
    normalized[snakeToCamel(key)] = normalizeKeysDeep(child);
  }

  return normalized;
}

export function normalizeRealtimePayload(payload: unknown): unknown {
  return normalizeKeysDeep(unwrapBroadcastPayload(payload));
}

export function normalizeConnectedPlayer(value: unknown): unknown {
  const normalized = normalizeKeysDeep(value);
  if (!normalized || typeof normalized !== "object") return normalized;

  const record = normalized as Record<string, unknown>;
  const playerId = record.playerId ?? record.id ?? record.userId ?? record.player_id;
  const playerName =
    record.playerName ?? record.name ?? record.tag ?? record.displayName ?? record.player_name;

  const playerIdString = typeof playerId === "string" ? playerId.trim() : String(playerId ?? "").trim();
  if (!playerIdString) {
    return null;
  }

  return {
    playerId: playerIdString,
    playerName: typeof playerName === "string" && playerName.trim() ? playerName.trim() : "Player",
    teamId: record.teamId ?? record.team_id ?? null,
    joinedAt: record.joinedAt ?? record.joined_at ?? 0,
  };
}

export function parseConnectedPlayersFromUnknown(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeConnectedPlayer)
    .filter((player): player is NonNullable<typeof player> => player !== null);
}

function extractConnectedPlayers(record: Record<string, unknown>): unknown[] | null {
  const candidates = [
    record.connectedPlayers,
    record.players,
    record.onlinePlayers,
    record.presentPlayers,
    record.connected,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (record.player && typeof record.player === "object") {
    return [record.player];
  }

  return null;
}

export function normalizePresencePayload(payload: unknown): unknown {
  const normalized = normalizeRealtimePayload(payload);
  if (!normalized || typeof normalized !== "object") return normalized;

  const record = { ...(normalized as Record<string, unknown>) };
  const players = extractConnectedPlayers(record);

  if (players) {
    record.connectedPlayers = parseConnectedPlayersFromUnknown(players);
  }

  return record;
}

export function normalizeDashboardPayload(payload: unknown): unknown {
  return normalizeKeysDeep(payload);
}

function coerceNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/** Normalize one team row from Realtime or REST before Zod parsing. */
export function normalizeTeamScoreRow(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;

  const record = normalizeKeysDeep(value) as Record<string, unknown>;
  const teamId = record.teamId ?? record.id;
  const name = record.name ?? record.teamName;
  const teamIdString = typeof teamId === "string" ? teamId.trim() : String(teamId ?? "").trim();
  const nameString = typeof name === "string" ? name.trim() : String(name ?? "").trim();

  if (!teamIdString || !nameString) return null;

  return {
    teamId: teamIdString,
    name: nameString,
    color: typeof record.color === "string" && record.color.trim() ? record.color.trim() : undefined,
    totalXp: coerceNumber(record.totalXp ?? record.combinedScore ?? record.score),
  };
}

export function normalizeLeaderboardUpdatePayload(payload: unknown): unknown {
  const normalized = normalizeRealtimePayload(payload);
  if (!normalized || typeof normalized !== "object") return normalized;

  const record = { ...(normalized as Record<string, unknown>) };

  const teamsCandidate = record.teams ?? record.teamScores ?? record.team_scores;
  if (Array.isArray(teamsCandidate)) {
    record.teams = teamsCandidate
      .map(normalizeTeamScoreRow)
      .filter((team): team is Record<string, unknown> => team !== null);
  }

  if (!record.leaderboard && Array.isArray(record.entries)) {
    record.leaderboard = record.entries;
  }

  return record;
}
