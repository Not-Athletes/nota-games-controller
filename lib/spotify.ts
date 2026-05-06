const SPOTIFY_API = "https://api.spotify.com/v1";

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

export type SpotifyNowPlaying = {
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl?: string;
  isPlaying: boolean;
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

  private async hydrateTokenFromServer() {
    const response = await fetch("/api/auth/spotify/token");
    if (!response.ok) {
      this.token = undefined;
      this.deviceId = undefined;
      return false;
    }

    const data = (await response.json()) as { accessToken?: string };
    if (!data.accessToken) {
      this.token = undefined;
      this.deviceId = undefined;
      return false;
    }

    this.token = data.accessToken;
    return true;
  }

  getStatus(): SpotifyStatus {
    return {
      connected: Boolean(this.token),
      authenticated: Boolean(this.token),
      playerReady: Boolean(this.deviceId),
      deviceId: this.deviceId,
    };
  }

  async bootstrapAuthFromSession() {
    return this.hydrateTokenFromServer();
  }

  clearToken() {
    this.token = undefined;
    this.deviceId = undefined;
    this.player?.disconnect();
    this.player = undefined;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    query?: Record<string, string>
  ) {
    if (!this.token) {
      const hydrated = await this.hydrateTokenFromServer();
      if (!hydrated || !this.token) return false;
    }
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
      if (response.status === 401) {
        const hydrated = await this.hydrateTokenFromServer();
        if (hydrated && this.token) {
          const retry = await fetch(url, {
            ...options,
            headers: {
              Authorization: `Bearer ${this.token}`,
              "Content-Type": "application/json",
              ...(options.headers || {}),
            },
          });
          return retry.ok;
        }
      }
      return false;
    }

    return true;
  }

  async connectPlayer() {
    if (!this.token) {
      const hydrated = await this.hydrateTokenFromServer();
      if (!hydrated || !this.token) {
        return { ok: false, error: "No Spotify session found." };
      }
    }

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

  async fetchNowPlaying() {
    const response = await fetch("/api/auth/spotify/now-playing");
    if (!response.ok) return null;
    const data = (await response.json()) as { nowPlaying?: SpotifyNowPlaying | null };
    return data.nowPlaying ?? null;
  }
}

export const spotifyService = new SpotifyService();
