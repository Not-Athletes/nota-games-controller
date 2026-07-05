"use client";

import { useMemo } from "react";
import { teamDisplayKey } from "@/lib/session/playerTeams";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { useSessionStore } from "@/stores/sessionStore";

function teamKey(entry: LeaderboardEntry) {
  return teamDisplayKey(entry.teamId, entry.teamName);
}

function teamLabel(entry: LeaderboardEntry) {
  return entry.teamName ?? "Unassigned";
}

export type TeamScore = {
  id: string;
  name: string;
  combinedScore: number;
};

export function useSessionScores() {
  const leaderboard = useSessionStore((state) => state.leaderboard);

  const rankedPlayers = useMemo(
    () => [...leaderboard].sort((a, b) => b.totalXp - a.totalXp || a.rank - b.rank),
    [leaderboard]
  );

  const teams = useMemo((): TeamScore[] => {
    const byTeam = new Map<string, TeamScore>();

    for (const entry of rankedPlayers) {
      const key = teamKey(entry);
      const existing = byTeam.get(key);
      if (existing) {
        existing.combinedScore += entry.totalXp;
      } else {
        byTeam.set(key, {
          id: key,
          name: teamLabel(entry),
          combinedScore: entry.totalXp,
        });
      }
    }

    return Array.from(byTeam.values()).sort((a, b) => b.combinedScore - a.combinedScore);
  }, [rankedPlayers]);

  const teamScores = teams.filter((team) => team.id !== "unassigned");

  return {
    rankedPlayers,
    teamScores,
    hasTeamScores: teamScores.length > 0,
  };
}
