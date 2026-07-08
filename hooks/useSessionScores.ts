"use client";

import { useMemo } from "react";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { useSessionStore } from "@/stores/sessionStore";

export type { TeamScore } from "@/lib/session/teamScores";

export function useSessionScores() {
  const leaderboard = useSessionStore((state) => state.leaderboard);
  const teamScores = useSessionStore((state) => state.teamScores);

  const rankedPlayers = useMemo(
    () => [...leaderboard].sort((a, b) => b.totalXp - a.totalXp || a.rank - b.rank),
    [leaderboard]
  );

  return {
    rankedPlayers,
    teamScores,
  };
}

function useTeamColorForEntry(entry: Pick<LeaderboardEntry, "teamId" | "teamName">) {
  const teamScores = useSessionStore((state) => state.teamScores);
  const playerTeams = useSessionStore((state) => state.playerTeams);

  const fromTeamScores = teamScores.find(
    (team) =>
      (entry.teamId && team.teamId === entry.teamId) ||
      (entry.teamName && team.name.toLowerCase() === entry.teamName.toLowerCase())
  );

  const registry = Object.values(playerTeams).find(
    (team) => entry.teamName && team.teamName?.toLowerCase() === entry.teamName.toLowerCase()
  );

  return fromTeamScores?.color ?? registry?.teamColor ?? null;
}

export { useTeamColorForEntry };
