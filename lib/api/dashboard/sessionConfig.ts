import type { BackendSessionConfig } from "@/lib/api/dashboard/schemas";
import type { SessionConfig } from "@/types/session";

export function toBackendSessionConfig(config: SessionConfig): BackendSessionConfig {
  return {
    stations: config.stations,
    roundsPerStation: config.roundsPerStation,
    fullSessionPasses: config.fullSessionPasses,
    workDurationSecs: config.workTime,
    restDurationSecs: config.restTime,
  };
}
