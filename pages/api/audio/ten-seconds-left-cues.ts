import { readdir } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";

const TEN_SECONDS_LEFT_AUDIO_PATTERN = /^ten_seconds_left_(\d+)\.mp3$/;
const DEFAULT_TEN_SECONDS_LEFT_CUE_PATH = "/audio/ten_seconds_left/ten_seconds_left_01.mp3";

type TenSecondsLeftCuesResponse = {
  tenSecondsLeftCues: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TenSecondsLeftCuesResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    return res.status(200).json({
      tenSecondsLeftCues:
        tenSecondsLeftCues.length > 0
          ? tenSecondsLeftCues
          : [DEFAULT_TEN_SECONDS_LEFT_CUE_PATH],
    });
  } catch (error) {
    console.warn("Failed to discover ten seconds left cues", error);
    return res.status(200).json({ tenSecondsLeftCues: [DEFAULT_TEN_SECONDS_LEFT_CUE_PATH] });
  }
}
