import { NextResponse } from "next/server";

function getCallbackUrl(requestUrl: string) {
  const postAuthBase =
    process.env.SPOTIFY_POST_AUTH_REDIRECT_URL?.replace(/\/$/, "") ??
    new URL(requestUrl).origin;

  return `${postAuthBase}?spotify=connected`;
}

/** Legacy entry point — forwards to Auth.js Spotify sign-in. */
export async function GET(request: Request) {
  const signInUrl = new URL("/api/auth/signin/spotify", request.url);
  signInUrl.searchParams.set("callbackUrl", getCallbackUrl(request.url));
  return NextResponse.redirect(signInUrl);
}
