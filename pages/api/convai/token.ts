import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Mints a short-lived ElevenLabs conversation token for the NOTA Coach agent.
 *
 * The ElevenLabs API key never leaves the server. Voice (audio) conversations
 * use WebRTC, which authenticates with a conversation token. If the coach isn't
 * configured (no API key / agent id), we return 503 so the client transparently
 * falls back to pre-recorded cues.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return res.status(503).json({ error: "coach_not_configured" });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(
        agentId
      )}`,
      { headers: { "xi-api-key": apiKey } }
    );

    if (!response.ok) {
      return res.status(502).json({ error: "token_request_failed" });
    }

    const body = (await response.json()) as { token?: string };
    if (!body.token) {
      return res.status(502).json({ error: "token_missing" });
    }

    return res.status(200).json({ token: body.token });
  } catch {
    return res.status(502).json({ error: "token_request_error" });
  }
}
