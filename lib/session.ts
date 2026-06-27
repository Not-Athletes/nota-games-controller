import type { PassConfig, Phase, SessionConfig } from "@/types/session";
import { getTotalIntervalsFromPasses } from "@/lib/session/config";

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
  return getTotalIntervalsFromPasses(config.passes);
}

export function getPassConfig(config: SessionConfig, passNumber: number): PassConfig {
  return config.passes[passNumber - 1] ?? config.passes[0];
}
