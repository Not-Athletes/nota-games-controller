type CueName =
  | "startSession"
  | "workStart"
  | "rest"
  | "rotateStations"
  | "nextRound"
  | "sessionComplete";

const CUE_PATHS: Record<CueName, string> = {
  startSession: "/audio/start-session.mp3",
  workStart: "/audio/work-start.mp3",
  rest: "/audio/rest_audio.mp3",
  rotateStations: "/audio/rotate-stations.mp3",
  nextRound: "/audio/next-round.mp3",
  sessionComplete: "/audio/session-complete.mp3",
};

export class AudioCues {
  private cueVolume = 100;

  setCueVolume(volume: number) {
    this.cueVolume = Math.min(100, Math.max(0, volume));
  }

  async play(cue: CueName) {
    if (typeof window === "undefined") return;

    try {
      const audio = new Audio(CUE_PATHS[cue]);
      audio.volume = this.cueVolume / 100;
      await audio.play();
    } catch (error) {
      console.warn("Failed to play cue", cue, error);
    }
  }
}
