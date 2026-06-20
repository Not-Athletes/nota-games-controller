import { z } from "zod";

/** QR payload for joining a session without a pre-assigned player link. */
export const sessionLinkPayloadSchema = z.object({
  v: z.literal(1),
  type: z.literal("nota-session"),
  sessionId: z.string().min(1),
});

export type SessionLinkPayload = z.infer<typeof sessionLinkPayloadSchema>;

export function encodeSessionLinkPayload(sessionId: string): string {
  const payload: SessionLinkPayload = {
    v: 1,
    type: "nota-session",
    sessionId,
  };
  return JSON.stringify(payload);
}

export function decodeSessionLinkPayload(raw: string): SessionLinkPayload | null {
  try {
    const parsed = sessionLinkPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
