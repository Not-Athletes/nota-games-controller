import { z } from "zod";

// Accepts a Spotify playlist URI (spotify:playlist:<id>) or an
// open.spotify.com playlist link (optionally with a ?si=… query / locale path).
const SPOTIFY_PLAYLIST_REGEX =
  /^(spotify:playlist:[A-Za-z0-9]+|https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?playlist\/[A-Za-z0-9]+(?:[/?].*)?)$/;

export const passConfigSchema = z.object({
  stations: z.coerce.number().int().min(1).max(12),
  roundsPerStation: z.coerce.number().int().min(1).max(10),
  workTime: z.coerce.number().int().min(10).max(120),
  restTime: z.coerce.number().int().min(5).max(60),
  restBetweenStationsTime: z.coerce.number().int().min(5).max(120),
});

export const setupSchema = z.object({
  passes: z.array(passConfigSchema).min(1),
  maxTrackPlaySeconds: z.coerce.number().int().min(30).max(600),
  spotifyEnabled: z.boolean(),
  spotifyPlaylistUri: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine(
      (value) => value === undefined || SPOTIFY_PLAYLIST_REGEX.test(value),
      {
        message:
          "Enter a valid Spotify playlist link (https://open.spotify.com/playlist/…) or URI (spotify:playlist:…).",
      }
    ),
});

export type SetupSchema = z.infer<typeof setupSchema>;
export type PassConfigSchema = z.infer<typeof passConfigSchema>;
