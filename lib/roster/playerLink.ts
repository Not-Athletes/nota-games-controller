import { z } from "zod";

/** QR payload scanned by a phone until wearables replace this flow. */
export const playerLinkPayloadSchema = z.object({
  v: z.literal(1),
  type: z.literal("nota-player"),
  id: z.string().min(1),
  tag: z.string().min(1),
});

export type PlayerLinkPayload = z.infer<typeof playerLinkPayloadSchema>;

export function encodePlayerLinkPayload(player: { id: string; tag: string }): string {
  const payload: PlayerLinkPayload = {
    v: 1,
    type: "nota-player",
    id: player.id,
    tag: player.tag,
  };
  return JSON.stringify(payload);
}

export function decodePlayerLinkPayload(raw: string): PlayerLinkPayload | null {
  try {
    const parsed = playerLinkPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
