import { z } from "zod";

/** Matches `lib/gameState/game-state.schema.json` */
export const gameStatePayloadSchema = z.object({
  timestamp: z.number().int(),
  state: z.object({
    phase: z.enum(["idle", "work", "rest", "passBreak", "complete"]),
    currentStation: z.number().int(),
    currentRound: z.number().int(),
    currentPass: z.number().int(),
    timeRemaining: z.number(),
    isRunning: z.boolean(),
    isPaused: z.boolean(),
    completedIntervals: z.number().int(),
    totalIntervals: z.number().int(),
    startedAtMs: z.number().int().optional(),
    endedAtMs: z.number().int().optional(),
  }),
  config: z
    .object({
      workTime: z.number().int(),
      restTime: z.number().int(),
      restBetweenStationsTime: z.number().int(),
      roundsPerStation: z.number().int(),
      stations: z.number().int(),
      fullSessionPasses: z.number().int(),
      maxTrackPlaySeconds: z.number().int(),
      workVolume: z.number(),
      restVolume: z.number(),
      spotifyPlaylistUri: z.string().optional(),
      spotifyEnabled: z.boolean(),
    })
    .nullable(),
});
