import type { Phase, SessionConfig } from "@/types/session";

export function isSpotifyPlaybackActive(
  config: Pick<SessionConfig, "spotifyEnabled" | "spotifyPlaylistUri"> | null
) {
  return Boolean(config?.spotifyEnabled && config.spotifyPlaylistUri?.trim());
}

export function getRestDuration(config: SessionConfig, betweenStations: boolean) {
  return betweenStations ? config.restBetweenStationsTime : config.restTime;
}

export function getPhaseDuration(phase: Phase, config: SessionConfig) {
  switch (phase) {
    case "work":
      return config.workTime;
    case "rest":
      return config.restTime;
    default:
      return 0;
  }
}

export function getTotalIntervals(config: SessionConfig) {
  const worksPerPass = config.stations * config.roundsPerStation;
  // Every work has a matching rest except the final work of each pass,
  // which transitions straight to the next pass (or completion).
  const restsPerPass = worksPerPass - 1;
  return (worksPerPass + restsPerPass) * config.fullSessionPasses;
}
