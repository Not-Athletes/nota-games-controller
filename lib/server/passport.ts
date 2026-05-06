import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";

type SpotifyAuthUser = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  profileId: string;
};

declare global {
  var __spotifyStrategyInitialized: boolean | undefined;
}

if (!global.__spotifyStrategyInitialized) {
  const clientID = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const callbackURL = process.env.SPOTIFY_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    throw new Error(
      "Missing Spotify env vars: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_CALLBACK_URL"
    );
  }

  passport.use(
    "spotify",
    new SpotifyStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      (accessToken, refreshToken, expiresIn, profile, done) => {
        const user: SpotifyAuthUser = {
          accessToken,
          refreshToken,
          expiresIn,
          profileId: profile.id,
        };
        done(null, user);
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: Express.User, done) => done(null, user));

  global.__spotifyStrategyInitialized = true;
}

export default passport;
export type { SpotifyAuthUser };
