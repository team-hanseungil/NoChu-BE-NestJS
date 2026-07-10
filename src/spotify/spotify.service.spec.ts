import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { SpotifyService } from './spotify.service';

const CONFIG: Record<string, string> = {
  SPOTIFY_CLIENT_ID: 'client-id',
  SPOTIFY_CLIENT_SECRET: 'client-secret',
};

function jsonResponse(ok: boolean, body: unknown): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe('SpotifyService', () => {
  let service: SpotifyService;
  let fetchMock: jest.SpyInstance;

  const fetchUrls = (): string[] =>
    (fetchMock.mock.calls as [string][]).map(([u]) => u);

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => CONFIG[key]),
    } as unknown as ConfigService;
    service = new SpotifyService(configService);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('searchTracks', () => {
    it('fetches a token then maps search results', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(true, { access_token: 'app-token', expires_in: 3600 }),
        )
        .mockResolvedValueOnce(
          jsonResponse(true, {
            tracks: {
              items: [
                {
                  id: 't1',
                  name: 'Song',
                  artists: [{ name: 'A' }, { name: 'B' }],
                  album: { name: 'Album', images: [{ url: 'http://img' }] },
                  duration_ms: 1000,
                  external_urls: { spotify: 'http://track' },
                },
              ],
            },
          }),
        );

      const tracks = await service.searchTracks('happy');

      expect(tracks).toHaveLength(1);
      expect(tracks[0]).toMatchObject({
        id: 't1',
        title: 'Song',
        artists: ['A', 'B'],
        albumImageUrl: 'http://img',
        spotifyUrl: 'http://track',
      });
    });

    it('reuses the cached token on a second search', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(true, { access_token: 'tok', expires_in: 3600 }),
        )
        .mockResolvedValue(jsonResponse(true, { tracks: { items: [] } }));

      await service.searchTracks('a');
      await service.searchTracks('b');

      const tokenCalls = fetchUrls().filter((u) =>
        u.includes('accounts.spotify.com'),
      );
      expect(tokenCalls).toHaveLength(1);
    });

    it('throws when search fails', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(true, { access_token: 'tok', expires_in: 3600 }),
        )
        .mockResolvedValueOnce(jsonResponse(false, {}));

      await expect(service.searchTracks('x')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('handles missing album images and external_urls with fallbacks', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(true, { access_token: 'tok', expires_in: 3600 }),
        )
        .mockResolvedValueOnce(
          jsonResponse(true, {
            tracks: {
              items: [
                {
                  id: 't9',
                  name: 'Bare',
                  artists: [{ name: 'A' }],
                  album: { name: 'Album' },
                },
              ],
            },
          }),
        );

      const tracks = await service.searchTracks('x');

      expect(tracks[0].albumImageUrl).toBeNull();
      expect(tracks[0].spotifyUrl).toBe('https://open.spotify.com/track/t9');
      expect(tracks[0].previewUrl).toBeNull();
      expect(tracks[0].durationMs).toBe(0);
    });
  });

  describe('createPlaylist', () => {
    it('refreshes token, creates playlist, adds tracks', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(true, { access_token: 'user-token' }),
        )
        .mockResolvedValueOnce(
          jsonResponse(true, {
            id: 'pl-1',
            external_urls: { spotify: 'http://playlist' },
          }),
        )
        .mockResolvedValueOnce(jsonResponse(true, {}));

      const result = await service.createPlaylist(
        'refresh-token',
        'sp-user',
        'My Mix',
        ['t1', 't2'],
      );

      expect(result).toEqual({ id: 'pl-1', url: 'http://playlist' });
      expect(fetchUrls()[1]).toContain('/v1/users/sp-user/playlists');
    });

    it('chunks track additions into batches of 100', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(true, { access_token: 'user-token' }),
        )
        .mockResolvedValueOnce(jsonResponse(true, { id: 'pl-1' }))
        .mockResolvedValue(jsonResponse(true, {}));

      const ids = Array.from({ length: 150 }, (_, i) => `t${i}`);
      await service.createPlaylist('r', 'u', 'name', ids);

      const trackCalls = fetchUrls().filter((u) => u.includes('/tracks'));
      expect(trackCalls).toHaveLength(2);
    });

    it('throws when token refresh fails', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(false, {}));
      await expect(
        service.createPlaylist('r', 'u', 'n', ['t1']),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('does not call the tracks endpoint when there are no tracks', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(true, { access_token: 'user-token' }),
        )
        .mockResolvedValueOnce(jsonResponse(true, { id: 'pl-1' }));

      const result = await service.createPlaylist('r', 'u', 'name', []);

      expect(result.id).toBe('pl-1');
      const trackCalls = fetchUrls().filter((u) => u.includes('/tracks'));
      expect(trackCalls).toHaveLength(0);
    });
  });
});
