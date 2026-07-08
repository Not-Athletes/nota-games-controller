import type { LeaderboardEntry } from "@/lib/api/dashboard/schemas";
import { teamDisplayKey } from "@/lib/session/playerTeams";

export type TeamScore = {
  id: string;
  teamId: string | null;
  name: string;
  color: string;
  totalXp: number;
};

export type RealtimeTeamScore = {
  teamId: string;
  name: string;
  color: string;
  totalXp: number;
};

export const DEFAULT_TEAM_SCORES: TeamScore[] = [
  { id: "team-red", teamId: null, name: "Red", color: "#EF4444", totalXp: 0 },
  { id: "team-blue", teamId: null, name: "Blue", color: "#3B82F6", totalXp: 0 },
];

export function createDefaultTeamScores(): TeamScore[] {
  return DEFAULT_TEAM_SCORES.map((team) => ({ ...team }));
}

function matchesTeamSlot(name: string, slotId: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (slotId === "team-red") {
    return (
      normalized === "red" ||
      normalized === "team red" ||
      normalized.endsWith("-red") ||
      normalized.includes(" red")
    );
  }
  if (slotId === "team-blue") {
    return (
      normalized === "blue" ||
      normalized === "team blue" ||
      normalized.endsWith("-blue") ||
      normalized.includes(" blue")
    );
  }
  return false;
}

function slotIndexForIncoming(team: RealtimeTeamScore, slots: TeamScore[]): number {
  const normalizedName = team.name.trim().toLowerCase();
  const byName = slots.findIndex((slot) => slot.name.toLowerCase() === normalizedName);
  if (byName >= 0) return byName;

  const byId = slots.findIndex((slot) => slot.teamId === team.teamId);
  if (byId >= 0) return byId;

  const byFuzzy = slots.findIndex((slot) => matchesTeamSlot(team.name, slot.id));
  if (byFuzzy >= 0) return byFuzzy;

  return -1;
}

/** Sum player XP into Red/Blue when Realtime does not send team totals. */
export function deriveTeamScoresFromLeaderboard(
  entries: LeaderboardEntry[],
  base: TeamScore[] = createDefaultTeamScores()
): TeamScore[] {
  const slots = base.map((team) => ({ ...team, totalXp: 0 }));

  for (const entry of entries) {
    if (!entry.teamId && !entry.teamName) continue;

    const index = slotIndexForIncoming(
      {
        teamId: entry.teamId ?? entry.teamName ?? "",
        name: entry.teamName ?? entry.teamId ?? "",
        color: "",
        totalXp: 0,
      },
      slots
    );

    if (index < 0) continue;
    slots[index].totalXp += entry.totalXp;
  }

  return slots;
}

/** Prefer Realtime team totals; otherwise roll up from player leaderboard rows. */
export function resolveTeamScores(
  incomingTeams: RealtimeTeamScore[],
  entries: LeaderboardEntry[],
  current: TeamScore[]
): TeamScore[] {
  if (incomingTeams.length > 0) {
    return mergeRealtimeTeamScores(incomingTeams);
  }

  return deriveTeamScoresFromLeaderboard(entries, current);
}

/** Overlay Realtime normalized team totals onto the fixed Red/Blue slots. */
export function mergeRealtimeTeamScores(incoming: RealtimeTeamScore[]): TeamScore[] {
  const slots = createDefaultTeamScores();

  for (const team of incoming) {
    const index = slotIndexForIncoming(team, slots);
    if (index < 0) continue;

    slots[index] = {
      id: teamDisplayKey(team.teamId, team.name),
      teamId: team.teamId,
      name: team.name,
      color: team.color || slots[index].color,
      totalXp: team.totalXp,
    };
  }

  return slots;
}

/** Apply team ids/colors from GET /participants without changing XP totals. */
export function mergeParticipantTeamMetadata(
  participants: Array<{
    teamId?: string | null;
    teamName?: string | null;
    teamColor?: string | null;
  }>,
  current: TeamScore[]
): TeamScore[] {
  const slots = current.map((team) => ({ ...team }));

  for (const participant of participants) {
    if (!participant.teamName) continue;

    const index = slotIndexForIncoming(
      {
        teamId: participant.teamId ?? participant.teamName,
        name: participant.teamName,
        color: participant.teamColor ?? "#888888",
        totalXp: 0,
      },
      slots
    );

    if (index < 0) continue;

    slots[index] = {
      ...slots[index],
      teamId: participant.teamId ?? slots[index].teamId,
      name: participant.teamName,
      color: participant.teamColor ?? slots[index].color,
    };
  }

  return slots;
}

export function enrichLeaderboardTeamNames(
  entries: LeaderboardEntry[],
  teamScores: TeamScore[]
): LeaderboardEntry[] {
  return entries.map((entry) => {
    if (entry.teamName) return entry;

    const team = teamScores.find((slot) => slot.teamId && slot.teamId === entry.teamId);
    return team ? { ...entry, teamName: team.name } : entry;
  });
}

export function teamScoreLookupKey(teamId: string | null | undefined, teamName: string | null | undefined) {
  return teamDisplayKey(teamId, teamName);
}

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;

  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

export function hexToRgba(hex: string, alpha: number) {
  const rgb = parseHexColor(hex);
  if (!rgb) return undefined;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function teamTintStyles(color: string) {
  return {
    background: `linear-gradient(to bottom, ${hexToRgba(color, 0.14) ?? color}, ${hexToRgba(color, 0.04) ?? color})`,
    color,
  } as const;
}

export function teamBadgeStyles(color: string) {
  return {
    backgroundColor: hexToRgba(color, 0.14),
    color,
  } as const;
}

export function findTeamColor(
  teamScores: TeamScore[],
  teamId: string | null | undefined,
  teamName: string | null | undefined
): string | null {
  const key = teamScoreLookupKey(teamId, teamName);
  const match = teamScores.find(
    (team) =>
      team.id === key ||
      (teamId && team.teamId === teamId) ||
      (teamName && team.name.toLowerCase() === teamName.toLowerCase())
  );
  return match?.color ?? null;
}
