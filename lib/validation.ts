import { z } from "zod";

export const setupSchema = z.object({
  workTime: z.coerce.number().int().min(10).max(120),
  restTime: z.coerce.number().int().min(5).max(60),
  roundsPerStation: z.coerce.number().int().min(1).max(10),
  stations: z.coerce.number().int().min(1).max(12),
  fullSessionPasses: z.coerce.number().int().min(1).max(5),
  maxTrackPlaySeconds: z.coerce.number().int().min(30).max(600),
  spotifyPlaylistUri: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
});

export type SetupSchema = z.infer<typeof setupSchema>;
