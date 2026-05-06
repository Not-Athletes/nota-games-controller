type CueName =
  | "intro"
  | "startSession"
  | "airHorn"
  | "workStart"
  | "rest"
  | "rotateStations"
  | "nextRound"
  | "sessionComplete";

const CUE_PATHS: Record<CueName, string> = {
  intro: "/audio/intro_audio.mp3",
  startSession: "/audio/start-session.mp3",
  airHorn: "/audio/air_horn.mp3",
  workStart: "/audio/work-start.mp3",
  rest: "/audio/rest_audio.mp3",
  rotateStations: "/audio/rotate-stations.mp3",
  nextRound: "/audio/next-round.mp3",
  sessionComplete: "/audio/session-complete.mp3",
};

export class AudioCues {
  private cueVolume = 100;
  private activeCues = new Map<CueName, HTMLAudioElement>();

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
      const audio = new Audio(CUE_PATHS[cue]);
      audio.volume = this.cueVolume / 100;
      this.activeCues.set(cue, audio);
      await audio.play();

      let triggered = false;
      const triggerNearEnd = () => {
        if (triggered) return;
        triggered = true;
        void onNearEnd?.();
      };

      await new Promise<void>((resolve) => {
        const onTimeUpdate = () => {
          if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
          const remainingMs = audio.duration * 1000 - audio.currentTime * 1000;
          if (remainingMs <= nearEndMs) {
            triggerNearEnd();
          }
        };

        const onDone = () => {
          triggerNearEnd();
          audio.removeEventListener("timeupdate", onTimeUpdate);
          if (this.activeCues.get(cue) === audio) {
            this.activeCues.delete(cue);
          }
          resolve();
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
