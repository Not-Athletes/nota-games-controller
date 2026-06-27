import type { PublishedSessionConfig } from "@/lib/gameState/types";
import type { PassConfig, SessionConfig, SetupInput } from "@/types/session";
import { DEFAULT_PASS } from "@/lib/session/constants";

export function createDefaultPass(): PassConfig {
  return { ...DEFAULT_PASS };
}

export function withActivePass(config: SessionConfig, passNumber: number): SessionConfig {
  const pass = config.passes[passNumber - 1];
  if (!pass) return config;

  return {
    ...config,
    stations: pass.stations,
    roundsPerStation: pass.roundsPerStation,
    workTime: pass.workTime,
    restTime: pass.restTime,
    restBetweenStationsTime: pass.restBetweenStationsTime,
  };
}

export function setupToSessionConfig(
  setup: SetupInput,
  volumes: { workVolume: number; restVolume: number }
): SessionConfig {
  const base: SessionConfig = {
    ...setup,
    totalPasses: setup.passes.length,
    workVolume: volumes.workVolume,
    restVolume: volumes.restVolume,
    stations: setup.passes[0].stations,
    roundsPerStation: setup.passes[0].roundsPerStation,
    workTime: setup.passes[0].workTime,
    restTime: setup.passes[0].restTime,
    restBetweenStationsTime: setup.passes[0].restBetweenStationsTime,
  };

  return base;
}

export function getIntervalsForPass(pass: PassConfig): number {
  const worksPerPass = pass.stations * pass.roundsPerStation;
  const restsPerPass = worksPerPass - 1;
  return worksPerPass + restsPerPass;
}

export function getTotalIntervalsFromPasses(passes: PassConfig[]): number {
  return passes.reduce((total, pass) => total + getIntervalsForPass(pass), 0);
}

export function estimatePassDurationSeconds(pass: PassConfig): number {
  let total = 0;

  for (let station = 1; station <= pass.stations; station += 1) {
    for (let round = 1; round <= pass.roundsPerStation; round += 1) {
      total += pass.workTime;

      const isFinalWork =
        station === pass.stations && round === pass.roundsPerStation;
      if (isFinalWork) continue;

      if (round === pass.roundsPerStation) {
        total += pass.restBetweenStationsTime;
      } else {
        total += pass.restTime;
      }
    }
  }

  return total;
}

export function estimateSessionDurationSeconds(passes: PassConfig[]): number {
  return passes.reduce((total, pass) => total + estimatePassDurationSeconds(pass), 0);
}

/** Flat config for published game state (current pass only, BAU field names). */
export function toPublishedConfig(config: SessionConfig): PublishedSessionConfig {
  return {
    workTime: config.workTime,
    restTime: config.restTime,
    restBetweenStationsTime: config.restBetweenStationsTime,
    roundsPerStation: config.roundsPerStation,
    stations: config.stations,
    fullSessionPasses: config.totalPasses,
    maxTrackPlaySeconds: config.maxTrackPlaySeconds,
    workVolume: config.workVolume,
    restVolume: config.restVolume,
    spotifyPlaylistUri: config.spotifyPlaylistUri,
    spotifyEnabled: config.spotifyEnabled,
  };
}
