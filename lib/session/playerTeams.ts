import type { LeaderboardEntry } from "@/lib/api/dashboard/schemas";
import type { ConnectedPlayer } from "@/types/session-api";

export type PlayerTeamInfo = {
  teamId: string | null;
  teamName: string | null;
};

export type PlayerTeamLookup = Record<string, PlayerTeamInfo>;

export function participantsToTeamLookup(
  participants: Array<{
    playerId: string;
    teamId?: string | null;
    teamName?: string | null;
  }>
): PlayerTeamLookup {
  const lookup: PlayerTeamLookup = {};
  for (const participant of participants) {
    lookup[participant.playerId] = {
      teamId: participant.teamId ?? null,
      teamName: participant.teamName ?? null,
    };
  }
  return lookup;
}

export function mergeTeamLookups(
  current: PlayerTeamLookup,
  incoming: PlayerTeamLookup
): PlayerTeamLookup {
  return { ...current, ...incoming };
}

export function teamNameFromTeamId(
  teamId: string | null | undefined,
  lookup: PlayerTeamLookup
): string | null {
  if (!teamId) return null;
  for (const info of Object.values(lookup)) {
    if (info.teamId === teamId && info.teamName) {
      return info.teamName;
    }
  }
  return null;
}

export function resolvePlayerTeam(
  player: Pick<ConnectedPlayer, "playerId" | "teamId">,
  lookup: PlayerTeamLookup
): PlayerTeamInfo {
  const fromRegistry = lookup[player.playerId];
  if (fromRegistry?.teamName) {
    return fromRegistry;
  }

  const teamId = fromRegistry?.teamId ?? player.teamId ?? null;
  const teamName =
    fromRegistry?.teamName ?? teamNameFromTeamId(teamId, lookup) ?? null;

  return { teamId, teamName };
}

export function enrichLeaderboardEntry(
  entry: LeaderboardEntry,
  lookup: PlayerTeamLookup,
  previous?: LeaderboardEntry
): LeaderboardEntry {
  const team = resolvePlayerTeam(
    { playerId: entry.playerId, teamId: entry.teamId },
    lookup
  );

  return {
    ...entry,
    teamId: entry.teamId ?? team.teamId ?? previous?.teamId ?? null,
    teamName: entry.teamName ?? team.teamName ?? previous?.teamName ?? null,
  };
}

export function enrichLeaderboard(
  entries: LeaderboardEntry[],
  lookup: PlayerTeamLookup,
  previous: LeaderboardEntry[] = []
): LeaderboardEntry[] {
  const previousByPlayerId = new Map(previous.map((entry) => [entry.playerId, entry]));
  return entries.map((entry) =>
    enrichLeaderboardEntry(entry, lookup, previousByPlayerId.get(entry.playerId))
  );
}

/** Stable key for Red/Blue team styling in the scoreboard UI. */
export function teamDisplayKey(
  teamId: string | null | undefined,
  teamName: string | null | undefined
): string {
  const normalized = teamName?.trim().toLowerCase();
  if (normalized === "red") return "team-red";
  if (normalized === "blue") return "team-blue";
  if (teamId) return teamId;
  if (teamName) return teamName;
  return "unassigned";
}

export function hasPlayersMissingTeamRegistry(
  players: ConnectedPlayer[],
  lookup: PlayerTeamLookup
): boolean {
  return players.some((player) => !(player.playerId in lookup));
}
