import type { NextApiRequest, NextApiResponse } from "next";
import type { Request, Response } from "express";
import passport, { type SpotifyAuthUser } from "@/lib/server/passport";
import {
  clearSpotifySession,
  setSpotifySession,
} from "@/lib/server/spotify-session";

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

function getRedirectBase() {
  return process.env.SPOTIFY_POST_AUTH_REDIRECT_URL ?? "http://localhost:3000";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await runMiddleware(req, res, passport.initialize());

    await new Promise<void>((resolve, reject) => {
      const authenticate = passport.authenticate(
        "spotify",
        { session: false },
        (error: unknown, user?: SpotifyAuthUser) => {
          if (error || !user?.accessToken) {
            clearSpotifySession(res);
            const failureUrl = `${getRedirectBase()}?spotify_error=auth_failed`;
            res.redirect(failureUrl);
            resolve();
            return;
          }
          const expiresIn = user.expiresIn ?? 3600;
          const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

          void setSpotifySession(res, {
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
            expiresAt,
            profileId: user.profileId,
          })
            .then(() => {
              const successUrl = `${getRedirectBase()}?spotify=connected`;
              res.redirect(successUrl);
              resolve();
            })
            .catch(() => {
              clearSpotifySession(res);
              const failureUrl = `${getRedirectBase()}?spotify_error=session_failed`;
              res.redirect(failureUrl);
              resolve();
            });
        }
      );

      authenticate(req, res, (result?: unknown) => {
        if (result instanceof Error) {
          reject(result);
        }
      });
    });

    return;
  } catch {
    return res.redirect(`${getRedirectBase()}?spotify_error=callback_failed`);
  }
}
