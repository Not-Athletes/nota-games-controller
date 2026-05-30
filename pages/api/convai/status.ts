import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Reports whether the NOTA Coach agent is configured and reachable, so the
 * setup screen can show a green/red indicator without starting a session.
 *
 * Always responds 200; the body describes the state:
 *   - configured: API key + agent id are present on the server.
 *   - reachable:  a conversation token could actually be minted (key valid,
 *                 agent exists, network ok).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return res.status(200).json({ configured: false, reachable: false });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(
        agentId
      )}`,
      { headers: { "xi-api-key": apiKey } }
    );

    if (!response.ok) {
      return res
        .status(200)
        .json({ configured: true, reachable: false, status: response.status });
    }

    const body = (await response.json()) as { token?: string };
    return res.status(200).json({ configured: true, reachable: Boolean(body.token) });
  } catch {
    return res.status(200).json({ configured: true, reachable: false });
  }
}
