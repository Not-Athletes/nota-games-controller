import type { NextApiRequest, NextApiResponse } from "next";
import type { Request, Response } from "express";
import passport from "@/lib/server/passport";

const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
];

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (req: Request, res: Response, next: (result?: unknown) => void) => void
) {
  return new Promise((resolve, reject) => {
    fn(req as unknown as Request, res as unknown as Response, (result?: unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await runMiddleware(req, res, passport.initialize());

    const authenticate = (
      passport.authenticate as unknown as (
        strategy: string,
        options: Record<string, unknown>
      ) => (req: NextApiRequest, res: NextApiResponse) => void
    )("spotify", {
      scope: SPOTIFY_SCOPES,
      showDialog: true,
      session: false,
    });

    return authenticate(req, res);
  } catch {
    return res.status(500).json({ error: "Unable to start Spotify auth flow." });
  }
}
