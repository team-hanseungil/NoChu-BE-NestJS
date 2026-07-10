import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SpotifyTrack {
  id: string;
  title: string;
  artists: string[];
  albumName: string;
  albumImageUrl: string | null;
  spotifyUrl: string | null;
  previewUrl: string | null;
  durationMs: number;
}

export interface CreatedSpotifyPlaylist {
  id: string;
  url: string | null;
}

interface SpotifySearchResponse {
  tracks: {
    items: Array<{
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      album: { name: string; images?: Array<{ url: string }> };
      duration_ms?: number;
      preview_url?: string | null;
      external_urls?: { spotify?: string };
    }>;
  };
}

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private expiresAt = 0;
  private tokenPromise: Promise<string> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID')!;
    this.clientSecret = this.configService.get<string>(
      'SPOTIFY_CLIENT_SECRET',
    )!;
  }

  async searchTracks(keywords: string, limit = 10): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();
    const query = keywords.trim().replace(/\s+/g, ' ');
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: String(limit),
      market: 'KR',
    });

    const response = await fetch(
      `https://api.spotify.com/v1/search?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      this.logger.error(`Spotify search failed: ${response.status}`);
      throw new ServiceUnavailableException('Spotify search failed');
    }

    const data = (await response.json()) as SpotifySearchResponse;
    return data.tracks.items.map((t) => ({
      id: t.id,
      title: t.name,
      artists: t.artists.map((a) => a.name),
      albumName: t.album.name,
      albumImageUrl: t.album.images?.[0]?.url ?? null,
      spotifyUrl:
        t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
      previewUrl: t.preview_url ?? null,
      durationMs: t.duration_ms ?? 0,
    }));
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt - 60_000) {
      return this.accessToken;
    }
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = this.requestToken().finally(() => {
      this.tokenPromise = null;
    });
    return this.tokenPromise;
  }

  private async requestToken(): Promise<string> {
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      this.logger.error(`Spotify auth failed: ${response.status}`);
      throw new ServiceUnavailableException('Spotify authentication failed');
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  async createPlaylist(
    refreshToken: string,
    spotifyUserId: string,
    name: string,
    trackIds: string[],
  ): Promise<CreatedSpotifyPlaylist> {
    const token = await this.refreshUserToken(refreshToken);

    const created = await this.userFetch<{
      id: string;
      external_urls?: { spotify?: string };
    }>(token, `/v1/users/${spotifyUserId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({ name, public: false }),
    });

    if (trackIds.length > 0) {
      await this.userFetch(token, `/v1/playlists/${created.id}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
          uris: trackIds.map((id) => `spotify:track:${id}`),
        }),
      });
    }

    return { id: created.id, url: created.external_urls?.spotify ?? null };
  }

  private async refreshUserToken(refreshToken: string): Promise<string> {
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      this.logger.error(
        `Spotify user token refresh failed: ${response.status}`,
      );
      throw new ServiceUnavailableException('Spotify token refresh failed');
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  private async userFetch<T>(
    token: string,
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await fetch(`https://api.spotify.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      this.logger.error(`Spotify ${path} failed: ${response.status}`);
      throw new ServiceUnavailableException('Spotify API request failed');
    }

    return (await response.json()) as T;
  }
}
