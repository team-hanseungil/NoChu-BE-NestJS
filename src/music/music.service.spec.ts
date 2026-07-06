import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MusicService } from './music.service';
import { EmotionsService } from '../emotions/emotions.service';
import { AiService } from '../ai/ai.service';
import { SpotifyService } from '../spotify/spotify.service';
import { Emotion } from '../emotions/emotion.entity';
import { Playlist } from '../playlists/playlist.entity';

describe('MusicService', () => {
  let service: MusicService;
  let emotionsService: { findTodayLatest: jest.Mock };
  let aiService: { extractKeywords: jest.Mock };
  let spotifyService: { searchTracks: jest.Mock };

  const userId = 'user-1';
  const emotion = {
    emotion: 'happy',
    emotions: {
      happy: 0.8,
      surprise: 0,
      anger: 0,
      anxiety: 0,
      hurt: 0,
      sad: 0.2,
    },
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

  beforeEach(async () => {
    emotionsService = { findTodayLatest: jest.fn() };
    aiService = { extractKeywords: jest.fn() };
    spotifyService = { searchTracks: jest.fn() };

    const dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MusicService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: EmotionsService, useValue: emotionsService },
        { provide: AiService, useValue: aiService },
        { provide: SpotifyService, useValue: spotifyService },
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

    const result = await service.recommend(userId, 'good day');

    expect(aiService.extractKeywords).toHaveBeenCalledWith(
      emotion.emotions,
      'good day',
    );
    expect(result.id).toBe('pl-1');
    expect(result.title).toBe('Happy Mix');
    expect(result.tracks[0].artists).toEqual(['Artist A']);
    expect(result.tracks[0].duration).toBe('3:20');
  });

  it('throws NotFoundException when no emotion today', async () => {
    emotionsService.findTodayLatest.mockResolvedValue(null);
    await expect(service.recommend(userId, null)).rejects.toBeInstanceOf(
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

    await expect(service.recommend(userId, null)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
