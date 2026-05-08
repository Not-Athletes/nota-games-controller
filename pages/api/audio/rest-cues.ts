import { readdir } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";

const REST_AUDIO_PATTERN = /^rest_audio_(\d+)\.mp3$/;
const DEFAULT_REST_CUE_PATH = "/audio/rest_audio_0.mp3";

type RestCuesResponse = {
  restCues: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RestCuesResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const audioDirectory = path.join(process.cwd(), "public", "audio");
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
      .map((entry) => `/audio/${entry.name}`);

    return res.status(200).json({
      restCues: restCues.length > 0 ? restCues : [DEFAULT_REST_CUE_PATH],
    });
  } catch (error) {
    console.warn("Failed to discover rest cues", error);
    return res.status(200).json({ restCues: [DEFAULT_REST_CUE_PATH] });
  }
}
