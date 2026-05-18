"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { AudioCues } from "@/lib/audio";

type CuePreviewControlsProps = {
  audioCuesRef: RefObject<AudioCues | null>;
  cueVolume: number;
};

export function CuePreviewControls({ audioCuesRef, cueVolume }: CuePreviewControlsProps) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    const cues = audioCuesRef.current;
    if (!cues) return;
    void cues.refreshRestCues();
    void cues.refreshTenSecondsLeftCues();
  }, [audioCuesRef]);

  const preview = useCallback(
    async (play: (cues: AudioCues) => Promise<void>) => {
      const cues = audioCuesRef.current;
      if (!cues || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        cues.setCueVolume(cueVolume);
        await play(cues);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [audioCuesRef, cueVolume]
  );

  return (
    <section className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-zinc-900">Preview session cues</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Play each sound during debrief so participants recognize it when the session runs.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => preview((c) => c.playAndWait("tenSecondsLeft"))}
          className="rounded-sm border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          10 seconds left
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => preview((c) => c.playAndWait("airHorn"))}
          className="rounded-sm border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Air horn
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => preview((c) => c.playAndWait("rest"))}
          className="rounded-sm border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Rest
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => preview((c) => c.playAndWait("switchStation"))}
          className="rounded-sm border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next station
        </button>
      </div>
    </section>
  );
}
