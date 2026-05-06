import { z } from "zod";

export const setupSchema = z.object({
  attendees: z.coerce.number().int().min(1).max(30),
  workTime: z.coerce.number().int().min(10).max(120),
  restTime: z.coerce.number().int().min(5).max(60),
  roundsPerStation: z.coerce.number().int().min(1).max(10),
  stations: z.coerce.number().int().min(1).max(12),
  spotifyPlaylistUri: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  workVolume: z.coerce.number().int().min(0).max(100),
  restVolume: z.coerce.number().int().min(0).max(100),
  cueVolume: z.coerce.number().int().min(0).max(100),
});

export type SetupSchema = z.infer<typeof setupSchema>;
