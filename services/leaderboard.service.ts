import { apiRequest } from "@/services/api-client";
import {
  leaderboardResponseSchema,
  type LeaderboardEntry,
} from "@/lib/api/dashboard/schemas";

export const leaderboardService = {
  async fetchLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
    const response = await apiRequest(
      `/dashboard/sessions/${sessionId}/leaderboard`,
      undefined,
      leaderboardResponseSchema
    );
    return response.leaderboard;
  },
};
