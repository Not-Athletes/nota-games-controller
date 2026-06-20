import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const TEN_SECONDS_LEFT_AUDIO_PATTERN = /^ten_seconds_left_(\d+)\.mp3$/;
const DEFAULT_TEN_SECONDS_LEFT_CUE_PATH = "/audio/ten_seconds_left/ten_seconds_left_01.mp3";

export async function GET() {
  try {
    const audioDirectory = path.join(process.cwd(), "public", "audio", "ten_seconds_left");
    const entries = await readdir(audioDirectory, { withFileTypes: true });

    const tenSecondsLeftCues = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .map((name) => {
        const match = name.match(TEN_SECONDS_LEFT_AUDIO_PATTERN);
        if (!match) return null;
        return { name, index: Number.parseInt(match[1], 10) };
      })
      .filter((entry): entry is { name: string; index: number } => Boolean(entry))
      .sort((a, b) => a.index - b.index)
      .map((entry) => `/audio/ten_seconds_left/${entry.name}`);

    return NextResponse.json({
      tenSecondsLeftCues:
        tenSecondsLeftCues.length > 0 ? tenSecondsLeftCues : [DEFAULT_TEN_SECONDS_LEFT_CUE_PATH],
    });
  } catch (error) {
    console.warn("Failed to discover ten seconds left cues", error);
    return NextResponse.json({ tenSecondsLeftCues: [DEFAULT_TEN_SECONDS_LEFT_CUE_PATH] });
  }
}
