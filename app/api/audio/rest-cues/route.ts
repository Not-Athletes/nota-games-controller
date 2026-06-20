import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const REST_AUDIO_PATTERN = /^rest_audio_(\d+)\.mp3$/;
const DEFAULT_REST_CUE_PATH = "/audio/rest/rest_audio_0.mp3";

export async function GET() {
  try {
    const audioDirectory = path.join(process.cwd(), "public", "audio", "rest");
    const entries = await readdir(audioDirectory, { withFileTypes: true });

    const restCues = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .map((name) => {
        const match = name.match(REST_AUDIO_PATTERN);
        if (!match) return null;
        return { name, index: Number.parseInt(match[1], 10) };
      })
      .filter((entry): entry is { name: string; index: number } => Boolean(entry))
      .sort((a, b) => a.index - b.index)
      .map((entry) => `/audio/rest/${entry.name}`);

    return NextResponse.json({
      restCues: restCues.length > 0 ? restCues : [DEFAULT_REST_CUE_PATH],
    });
  } catch (error) {
    console.warn("Failed to discover rest cues", error);
    return NextResponse.json({ restCues: [DEFAULT_REST_CUE_PATH] });
  }
}
