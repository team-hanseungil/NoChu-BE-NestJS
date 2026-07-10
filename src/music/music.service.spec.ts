import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MusicService } from './music.service';
import { EmotionsService } from '../emotions/emotions.service';
import { AiService } from '../ai/ai.service';
import { SpotifyService } from '../spotify/spotify.service';
import { UsersService } from '../users/users.service';
import { PreferencesService } from '../preferences/preferences.service';
import { RedisService } from '../redis/redis.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { Emotion } from '../emotions/emotion.entity';
import { Playlist } from '../playlists/playlist.entity';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('MusicService', () => {
  let service: MusicService;
  let emotionsService: { findTodayLatest: jest.Mock };
  let aiService: { extractKeywords: jest.Mock };
  let spotifyService: { searchTracks: jest.Mock; createPlaylist: jest.Mock };
  let usersService: { findOne: jest.Mock };
  let preferencesService: { findByUserId: jest.Mock };
  let redisService: { get: jest.Mock; set: jest.Mock };
  let cryptoService: { decrypt: jest.Mock };

  const userId = 'user-1';
  const emotion = {
    emotion: 'happy',
    emotions: { happy: 0.8, surprise: 0, anger: 0, sad: 0.2 },
  } as Emotion;

  const track = {
    id: 'track-1',
    title: 'Song A',
    artists: ['Artist A'],
    albumName: 'Album A',
    albumImageUrl: 'https://img/a.png',
    spotifyUrl: 'https://open.spotify.com/track/track-1',
    previewUrl: null,
    durationMs: 200000,
  };

  const savedPlaylist = {
    id: 'pl-1',
    title: 'Happy Mix',
    imageUrl: 'https://img/a.png',
    playlistSongs: [
      {
        rank: 0,
        song: {
          title: 'Song A',
          artist: JSON.stringify(['Artist A']),
          albumImageUrl: 'https://img/a.png',
          spotifyUrl: 'https://open.spotify.com/track/track-1',
          durationMs: 200000,
        },
      },
    ],
  } as Playlist;

  const manager = {
    create: jest.fn((_e: unknown, v: unknown) => v),
    save: jest.fn((a: unknown, b?: unknown) => {
      if (Array.isArray(b)) {
        return Promise.resolve(
          b.map((v, i) => ({ id: `row-${i}`, ...(v as object) })),
        );
      }
      return Promise.resolve({ id: 'pl-1', ...(a as object) });
    }),
    find: jest.fn().mockResolvedValue([]),
    findOneOrFail: jest.fn().mockResolvedValue(savedPlaylist),
  };

  const playlistRepo = { update: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    emotionsService = { findTodayLatest: jest.fn() };
    aiService = { extractKeywords: jest.fn() };
    spotifyService = { searchTracks: jest.fn(), createPlaylist: jest.fn() };
    usersService = { findOne: jest.fn().mockResolvedValue(null) };
    preferencesService = { findByUserId: jest.fn().mockResolvedValue(null) };
    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    cryptoService = { decrypt: jest.fn((v: string) => `dec(${v})`) };
    playlistRepo.update.mockClear();

    const dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
      getRepository: jest.fn(() => playlistRepo),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MusicService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: EmotionsService, useValue: emotionsService },
        { provide: AiService, useValue: aiService },
        { provide: SpotifyService, useValue: spotifyService },
        { provide: UsersService, useValue: usersService },
        { provide: PreferencesService, useValue: preferencesService },
        { provide: RedisService, useValue: redisService },
        { provide: CryptoService, useValue: cryptoService },
      ],
    }).compile();

    service = moduleRef.get(MusicService);
  });

  it('recommends a playlist from today emotion', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(emotion);
    aiService.extractKeywords.mockResolvedValue({
      keywords: 'happy upbeat',
      title: 'Happy Mix',
    });
    spotifyService.searchTracks.mockResolvedValue([track]);
    preferencesService.findByUserId.mockResolvedValue({
      data: { genre: ['pop'] },
    });

    const result = await service.recommend(userId);

    expect(aiService.extractKeywords).toHaveBeenCalledWith(
      emotion.emotions,
      JSON.stringify({ genre: ['pop'] }),
    );
    expect(result.id).toBe('pl-1');
    expect(result.title).toBe('Happy Mix');
    expect(result.tracks[0].artists).toEqual(['Artist A']);
    expect(result.tracks[0].duration).toBe('3:20');
  });

  it('sends null comment when the user has no preferences', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(emotion);
    aiService.extractKeywords.mockResolvedValue({ keywords: 'k', title: 'T' });
    spotifyService.searchTracks.mockResolvedValue([track]);
    preferencesService.findByUserId.mockResolvedValue(null);

    await service.recommend(userId);

    expect(aiService.extractKeywords).toHaveBeenCalledWith(
      emotion.emotions,
      null,
    );
  });

  it('throws NotFoundException when no emotion today', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(null);
    await expect(service.recommend(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when spotify returns no tracks', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(emotion);
    aiService.extractKeywords.mockResolvedValue({
      keywords: 'happy',
      title: 'Mix',
    });
    spotifyService.searchTracks.mockResolvedValue([]);

    await expect(service.recommend(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('exports to Spotify when the user has a refresh token', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(emotion);
    aiService.extractKeywords.mockResolvedValue({
      keywords: 'happy',
      title: 'Happy Mix',
    });
    spotifyService.searchTracks.mockResolvedValue([track]);
    usersService.findOne.mockResolvedValue({
      spotifyId: 'sp-user',
      spotifyRefreshToken: 'enc-token',
    });
    spotifyService.createPlaylist.mockResolvedValue({
      id: 'sp-pl',
      url: 'https://open.spotify.com/playlist/sp-pl',
    });

    await service.recommend(userId);
    await flush();

    expect(cryptoService.decrypt).toHaveBeenCalledWith('enc-token');
    expect(spotifyService.createPlaylist).toHaveBeenCalledWith(
      'dec(enc-token)',
      'sp-user',
      'Happy Mix',
      ['track-1'],
    );
    expect(playlistRepo.update).toHaveBeenCalledWith(
      'pl-1',
      expect.objectContaining({
        spotifyPlaylistUrl: 'https://open.spotify.com/playlist/sp-pl',
      }),
    );
  });

  it('still succeeds when Spotify export fails (best-effort)', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(emotion);
    aiService.extractKeywords.mockResolvedValue({
      keywords: 'happy',
      title: 'Mix',
    });
    spotifyService.searchTracks.mockResolvedValue([track]);
    usersService.findOne.mockResolvedValue({
      spotifyId: 'sp-user',
      spotifyRefreshToken: 'enc-token',
    });
    spotifyService.createPlaylist.mockRejectedValue(new Error('spotify down'));

    const result = await service.recommend(userId);
    await flush();
    expect(result.id).toBe('pl-1');
    expect(playlistRepo.update).not.toHaveBeenCalled();
  });

  it('caches keyword extraction and skips AI on cache hit', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(emotion);
    spotifyService.searchTracks.mockResolvedValue([track]);
    redisService.get.mockResolvedValue(
      JSON.stringify({ keywords: 'cached', title: 'Cached Mix' }),
    );

    const result = await service.recommend(userId);

    expect(aiService.extractKeywords).not.toHaveBeenCalled();
    expect(spotifyService.searchTracks).toHaveBeenCalledWith('cached');
    expect(result.title).toBe('Happy Mix');
  });

  it('caches keyword result on a cache miss', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(emotion);
    aiService.extractKeywords.mockResolvedValue({
      keywords: 'fresh',
      title: 'Fresh Mix',
    });
    spotifyService.searchTracks.mockResolvedValue([track]);
    redisService.get.mockResolvedValue(null);

    await service.recommend(userId);

    expect(aiService.extractKeywords).toHaveBeenCalled();
    expect(redisService.set).toHaveBeenCalledWith(
      expect.stringMatching(/^music:kw:/),
      JSON.stringify({ keywords: 'fresh', title: 'Fresh Mix' }),
      expect.any(Number),
    );
  });
});
