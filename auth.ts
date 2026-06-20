import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import type { JWT } from "next-auth/jwt";
import { SPOTIFY_SCOPES } from "@/lib/server/spotify-scopes";
import { refreshSpotifyTokenRecord } from "@/lib/server/spotify-token";

function getAuthSecret() {
  return (
    process.env.AUTH_SECRET ??
    process.env.SPOTIFY_SESSION_SECRET ??
    (process.env.NODE_ENV === "development" ? "nota-dev-auth-secret" : undefined)
  );
}

function getPostAuthRedirectUrl() {
  return process.env.SPOTIFY_POST_AUTH_REDIRECT_URL?.replace(/\/$/, "");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: getAuthSecret(),
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: SPOTIFY_SCOPES,
          show_dialog: "true",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt:
            account.expires_at ??
            Math.floor(Date.now() / 1000) + (account.expires_in ?? 3600),
        } satisfies JWT;
      }

      const accessToken = token.accessToken;
      const expiresAt = token.expiresAt;
      if (
        accessToken &&
        typeof expiresAt === "number" &&
        expiresAt > Math.floor(Date.now() / 1000) + 60
      ) {
        return token;
      }

      if (!token.refreshToken) {
        return { ...token, error: "RefreshTokenMissing" } satisfies JWT;
      }

      const refreshed = await refreshSpotifyTokenRecord({
        accessToken: accessToken ?? "",
        refreshToken: token.refreshToken,
        expiresAt: expiresAt ?? 0,
      });

      if (refreshed.error || !refreshed.accessToken) {
        return { ...token, accessToken: undefined, error: refreshed.error } satisfies JWT;
      }

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
        error: undefined,
      } satisfies JWT;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.expiresAt = token.expiresAt;
      session.error = token.error;
      return session;
    },
    async redirect({ url, baseUrl }) {
      const postAuthBase = getPostAuthRedirectUrl() ?? baseUrl;

      if (url.startsWith("/")) {
        return `${postAuthBase}${url}`;
      }

      try {
        const target = new URL(url);
        const base = new URL(baseUrl);
        if (target.origin === base.origin) {
          return url;
        }
      } catch {
        return postAuthBase;
      }

      return postAuthBase;
    },
  },
});
