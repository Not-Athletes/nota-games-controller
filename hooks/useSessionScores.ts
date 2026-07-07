"use client";

import { useMemo } from "react";
import {
  DEFAULT_TEAM_SCORES,
  teamDisplayKey,
} from "@/lib/session/playerTeams";
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

  const teamScores = useMemo((): TeamScore[] => {
    const byTeam = new Map<string, TeamScore>(
      DEFAULT_TEAM_SCORES.map((team) => [team.id, { ...team }])
    );

    for (const entry of rankedPlayers) {
      const key = teamKey(entry);
      if (key !== "team-red" && key !== "team-blue") {
        continue;
      }

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

    return DEFAULT_TEAM_SCORES.map((team) => byTeam.get(team.id) ?? { ...team });
  }, [rankedPlayers]);

  return {
    rankedPlayers,
    teamScores,
  };
}
