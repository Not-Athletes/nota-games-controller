import type { NextApiRequest, NextApiResponse } from "next";
import { gameStatePayloadSchema } from "@/lib/gameState/schema";
import type { GameStatePayload } from "@/lib/gameState/types";

/** Latest snapshot — useful for a dashboard polling GET until realtime is wired. */
let latestSnapshot: GameStatePayload | null = null;

async function forwardToWebhook(payload: GameStatePayload) {
  const url = process.env.GAME_STATE_WEBHOOK_URL?.trim();
  if (!url) return;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameStatePayload | { ok: boolean } | { error: string }>
) {
  if (req.method === "GET") {
    if (!latestSnapshot) {
      return res.status(404).json({ error: "No game state yet" });
    }
    return res.status(200).json(latestSnapshot);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = gameStatePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid game state payload" });
  }

  latestSnapshot = parsed.data;

  try {
    await forwardToWebhook(parsed.data);
  } catch (error) {
    console.warn("Game state webhook forward failed", error);
  }

  return res.status(200).json({ ok: true });
}
