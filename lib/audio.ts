type CueName =
  | "intro"
  | "startSession"
  | "airHorn"
  | "passTransition"
  | "workStart"
  | "tenSecondsLeft"
  | "rest"
  | "buzzer"
  | "switchStation"
  | "rotateStations"
  | "nextRound"
  | "sessionComplete";

const CUE_PATHS: Record<CueName, string> = {
  intro: "/audio/intro_audio.mp3",
  startSession: "/audio/start-session.mp3",
  airHorn: "/audio/air_horn.mp3",
  passTransition: "/audio/pass_audio.mp3",
  workStart: "/audio/work-start.mp3",
  tenSecondsLeft: "/audio/ten_seconds_left/ten_seconds_left_01.mp3",
  rest: "/audio/rest/rest_audio_0.mp3",
  buzzer: "/audio/buzzer.mp3",
  switchStation: "/audio/switch_station.mp3",
  rotateStations: "/audio/rotate-stations.mp3",
  nextRound: "/audio/next-round.mp3",
  sessionComplete: "/audio/outro_audio.mp3",
};

const DEFAULT_REST_CUE_PATHS = [CUE_PATHS.rest];
const DEFAULT_TEN_SECONDS_LEFT_CUE_PATHS = [CUE_PATHS.tenSecondsLeft];

const shufflePaths = (paths: string[]) => {
  const shuffled = [...paths];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export class AudioCues {
  private cueVolume = 100;
  private activeCues = new Map<CueName, HTMLAudioElement>();
  private restCuePaths = DEFAULT_REST_CUE_PATHS;
  private tenSecondsLeftCuePaths = DEFAULT_TEN_SECONDS_LEFT_CUE_PATHS;
  private shuffledRestPaths: string[] = [];
  private shuffledTenSecondsLeftPaths: string[] = [];

  resetRestShuffle() {
    this.shuffledRestPaths = [];
  }

  resetTenSecondsLeftShuffle() {
    this.shuffledTenSecondsLeftPaths = [];
  }

  async waitForCueToFinish(cue: CueName) {
    const active = this.activeCues.get(cue);
    if (!active || active.ended) return;

    await new Promise<void>((resolve) => {
      let settled = false;
      const finalize = () => {
        if (settled) return;
        settled = true;
        active.removeEventListener("ended", onEnded);
        active.removeEventListener("error", onError);
        active.removeEventListener("pause", onPause);
        resolve();
      };

      const onEnded = () => {
        finalize();
      };
      const onError = () => {
        finalize();
      };
      const onPause = () => {
        if (this.activeCues.get(cue) !== active || active.currentTime === 0 || active.ended) {
          finalize();
        }
      };

      active.addEventListener("ended", onEnded, { once: true });
      active.addEventListener("error", onError, { once: true });
      active.addEventListener("pause", onPause);
    });
  }

  async refreshRestCues() {
    if (typeof window === "undefined") return;
    try {
      const response = await fetch("/api/audio/rest-cues", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { restCues?: string[] };
      if (!Array.isArray(payload.restCues) || payload.restCues.length === 0) return;
      const validPaths = payload.restCues.filter((path) => typeof path === "string");
      if (validPaths.length === 0) return;
      this.restCuePaths = validPaths;
      this.resetRestShuffle();
    } catch (error) {
      console.warn("Failed to refresh rest cues", error);
    }
  }

  async refreshTenSecondsLeftCues() {
    if (typeof window === "undefined") return;
    try {
      const response = await fetch("/api/audio/ten-seconds-left-cues", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { tenSecondsLeftCues?: string[] };
      if (!Array.isArray(payload.tenSecondsLeftCues) || payload.tenSecondsLeftCues.length === 0) {
        return;
      }
      const validPaths = payload.tenSecondsLeftCues.filter((path) => typeof path === "string");
      if (validPaths.length === 0) return;
      this.tenSecondsLeftCuePaths = validPaths;
      this.resetTenSecondsLeftShuffle();
    } catch (error) {
      console.warn("Failed to refresh ten seconds left cues", error);
    }
  }

  private getCuePath(cue: CueName) {
    if (cue === "rest") {
      if (this.restCuePaths.length === 0) {
        return CUE_PATHS[cue];
      }
      if (this.shuffledRestPaths.length === 0) {
        this.shuffledRestPaths = shufflePaths(this.restCuePaths);
      }
      const nextPath = this.shuffledRestPaths.shift();
      return nextPath ?? CUE_PATHS[cue];
    }

    if (cue === "tenSecondsLeft") {
      if (this.tenSecondsLeftCuePaths.length === 0) {
        return CUE_PATHS[cue];
      }
      if (this.shuffledTenSecondsLeftPaths.length === 0) {
        this.shuffledTenSecondsLeftPaths = shufflePaths(this.tenSecondsLeftCuePaths);
      }
      const nextPath = this.shuffledTenSecondsLeftPaths.shift();
      return nextPath ?? CUE_PATHS[cue];
    }

    return CUE_PATHS[cue];
  }

  setCueVolume(volume: number) {
    this.cueVolume = Math.min(100, Math.max(0, volume));
  }

  stop(cue: CueName) {
    const active = this.activeCues.get(cue);
    if (!active) return;
    active.pause();
    active.currentTime = 0;
    this.activeCues.delete(cue);
  }

  stopAll() {
    for (const cue of this.activeCues.keys()) {
      this.stop(cue);
    }
  }

  async play(cue: CueName) {
    void this.playAndWait(cue);
  }

  /** Play a cue `times` times back-to-back (e.g. a buzzer countdown). */
  async playTimes(cue: CueName, times: number) {
    for (let i = 0; i < times; i += 1) {
      await this.playAndWait(cue);
    }
  }

  async playAndWait(cue: CueName) {
    return this.playAndTriggerNearEnd(cue, 0);
  }

  async playAndTriggerNearEnd(
    cue: CueName,
    nearEndMs: number,
    onNearEnd?: () => void | Promise<void>
  ) {
    if (typeof window === "undefined") return;

    try {
      this.stop(cue);
      const audio = new Audio(this.getCuePath(cue));
      audio.volume = this.cueVolume / 100;
      this.activeCues.set(cue, audio);
      await audio.play();

      let triggered = false;
      let nearEndHook: Promise<void> = Promise.resolve();
      const triggerNearEnd = () => {
        if (triggered) return;
        triggered = true;
        nearEndHook = Promise.resolve(onNearEnd?.()).catch((err) => {
          console.warn("onNearEnd failed", err);
        });
      };

      await new Promise<void>((resolve) => {
        const finish = () => {
          void nearEndHook.finally(() => {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            if (this.activeCues.get(cue) === audio) {
              this.activeCues.delete(cue);
            }
            resolve();
          });
        };

        const onTimeUpdate = () => {
          if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
          const remainingMs = audio.duration * 1000 - audio.currentTime * 1000;
          if (remainingMs <= nearEndMs) {
            triggerNearEnd();
          }
        };

        const onDone = () => {
          triggerNearEnd();
          finish();
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onDone, { once: true });
        audio.addEventListener("error", onDone, { once: true });
      });
    } catch (error) {
      console.warn("Failed to play cue", cue, error);
    }
  }
}
