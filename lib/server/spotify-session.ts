import { SignJWT, jwtVerify } from "jose";
import { parse, serialize } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

const SPOTIFY_SESSION_COOKIE = "spotify_session";

type SpotifySessionPayload = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  profileId: string;
};

function getSessionSecret() {
  const secret = process.env.SPOTIFY_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SPOTIFY_SESSION_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export function readSpotifySessionToken(req: NextApiRequest) {
  const rawCookie = req.headers.cookie ?? "";
  const cookies = parse(rawCookie);
  return cookies[SPOTIFY_SESSION_COOKIE];
}

export async function readSpotifySession(req: NextApiRequest) {
  const token = readSpotifySessionToken(req);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return {
      accessToken: String(payload.accessToken ?? ""),
      refreshToken: payload.refreshToken ? String(payload.refreshToken) : undefined,
      expiresAt: Number(payload.expiresAt ?? 0),
      profileId: String(payload.profileId ?? ""),
    } satisfies SpotifySessionPayload;
  } catch {
    return null;
  }
}

async function signSpotifySession(payload: SpotifySessionPayload) {
  return new SignJWT(payload as unknown as Record<string, string | number>)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSessionSecret());
}

export async function setSpotifySession(
  res: NextApiResponse,
  payload: SpotifySessionPayload
) {
  const token = await signSpotifySession(payload);
  res.setHeader(
    "Set-Cookie",
    serialize(SPOTIFY_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  );
}

export function clearSpotifySession(res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    serialize(SPOTIFY_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}

export type { SpotifySessionPayload };
