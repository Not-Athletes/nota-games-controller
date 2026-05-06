const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

type SpotifyPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, listener: (payload: unknown) => void) => void;
};

export type SpotifyStatus = {
  connected: boolean;
  authenticated: boolean;
  playerReady: boolean;
  deviceId?: string;
  error?: string;
};

function normalizePlaylistUri(input?: string) {
  if (!input) return undefined;
  const value = input.trim();
  if (!value) return undefined;

  if (value.startsWith("spotify:playlist:")) {
    return value;
  }

  const match = value.match(
    /^https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/
  );
  if (match) {
    return `spotify:playlist:${match[1]}`;
  }

  return value;
}

async function loadSpotifySdk() {
  if (typeof window === "undefined") return false;
  if (window.Spotify?.Player) return true;

  const existingScript = document.getElementById("spotify-web-playback-sdk");
  if (!existingScript) {
    const script = document.createElement("script");
    script.id = "spotify-web-playback-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  }

  await new Promise<void>((resolve) => {
    if (window.Spotify?.Player) {
      resolve();
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => resolve();
  });

  return Boolean(window.Spotify?.Player);
}

export class SpotifyService {
  private token?: string;
  private player?: SpotifyPlayer;
  private deviceId?: string;

  getStatus(): SpotifyStatus {
    return {
      connected: Boolean(this.token),
      authenticated: Boolean(this.token),
      playerReady: Boolean(this.deviceId),
      deviceId: this.deviceId,
    };
  }

  getAuthUrl() {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      return null;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "token",
      redirect_uri: redirectUri,
      scope: SPOTIFY_SCOPES,
      show_dialog: "true",
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  initializeFromStorage() {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("spotify_access_token");
    if (stored) {
      this.token = stored;
    }
  }

  consumeTokenFromUrlHash() {
    if (typeof window === "undefined") return false;
    if (!window.location.hash.includes("access_token")) {
      return false;
    }

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");

    if (!accessToken) return false;
    this.token = accessToken;
    localStorage.setItem("spotify_access_token", accessToken);

    history.replaceState({}, document.title, window.location.pathname);
    return true;
  }

  clearToken() {
    this.token = undefined;
    this.deviceId = undefined;
    this.player?.disconnect();
    this.player = undefined;
    if (typeof window !== "undefined") {
      localStorage.removeItem("spotify_access_token");
    }
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    query?: Record<string, string>
  ) {
    if (!this.token) return false;
    const params = new URLSearchParams(query);
    const url = `${SPOTIFY_API}${endpoint}${params.size ? `?${params}` : ""}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      return false;
    }

    return true;
  }

  async connectPlayer() {
    if (!this.token) {
      return { ok: false, error: "No Spotify token found." };
    }

    const sdkLoaded = await loadSpotifySdk();
    if (!sdkLoaded || !window.Spotify?.Player) {
      return { ok: false, error: "Spotify SDK failed to load." };
    }

    this.player = new window.Spotify.Player({
      name: "Nota Games Class Controller",
      getOAuthToken: (cb) => cb(this.token as string),
      volume: 0.5,
    });

    const ready = new Promise<string>((resolve) => {
      this.player?.addListener("ready", (payload) => {
        const maybeReady = payload as { device_id?: string };
        if (maybeReady.device_id) {
          resolve(maybeReady.device_id);
        }
      });
    });

    this.player.addListener("authentication_error", (payload) => {
      const maybeError = payload as { message?: string };
      console.error("Spotify auth error", maybeError.message);
    });
    this.player.addListener("account_error", (payload) => {
      const maybeError = payload as { message?: string };
      console.error("Spotify account error", maybeError.message);
    });

    const connected = await this.player.connect();
    if (!connected) {
      return { ok: false, error: "Spotify player connection failed." };
    }

    this.deviceId = await ready;
    return { ok: true };
  }

  async playPlaylist(playlistInput?: string) {
    if (!this.deviceId) return false;
    const playlistUri = normalizePlaylistUri(playlistInput);
    if (!playlistUri) return false;

    return this.request(
      "/me/player/play",
      {
        method: "PUT",
        body: JSON.stringify({ context_uri: playlistUri }),
      },
      { device_id: this.deviceId }
    );
  }

  async pause() {
    return this.request("/me/player/pause", { method: "PUT" });
  }

  async setVolume(volume: number) {
    return this.request(
      "/me/player/volume",
      { method: "PUT" },
      { volume_percent: String(Math.min(100, Math.max(0, Math.round(volume)))) }
    );
  }
}

export const spotifyService = new SpotifyService();
