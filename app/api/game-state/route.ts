import { NextRequest, NextResponse } from "next/server";
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

export async function GET() {
  if (!latestSnapshot) {
    return NextResponse.json({ error: "No game state yet" }, { status: 404 });
  }

  return NextResponse.json(latestSnapshot);
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid game state payload" }, { status: 400 });
  }

  const parsed = gameStatePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid game state payload" }, { status: 400 });
  }

  latestSnapshot = parsed.data;

  try {
    await forwardToWebhook(parsed.data);
  } catch (error) {
    console.warn("Game state webhook forward failed", error);
  }

  return NextResponse.json({ ok: true });
}
