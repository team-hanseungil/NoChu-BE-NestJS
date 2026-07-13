import { createHash } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { EmotionsService } from '../emotions/emotions.service';
import { AiService, AiKeywordResult, EmotionRatios } from '../ai/ai.service';
import { SpotifyService, SpotifyTrack } from '../spotify/spotify.service';
import { UsersService } from '../users/users.service';
import { PreferencesService } from '../preferences/preferences.service';
import { RedisService } from '../redis/redis.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { Playlist } from '../playlists/playlist.entity';
import { PlaylistSong } from '../playlists/playlist-song.entity';
import { Song } from '../songs/song.entity';
import { PlaylistResDto } from '../playlists/dto/playlist.res.dto';

const KEYWORD_CACHE_TTL = 60 * 60;

const PREFERENCE_LABELS: Record<string, string> = {
  genres: '선호 장르',
  favorite_artists: '좋아하는 아티스트',
  negative_emotion_response: '부정적 감정일 때',
  positive_emotion_response: '긍정적 감정일 때',
};

const EMOTION_RESPONSE_TEXT: Record<string, string> = {
  opposite: '반대되는 분위기의 음악 선호',
  amplify: '감정을 증폭하는 음악 선호',
};

const EMOTION_RESPONSE_KEYS = [
  'negative_emotion_response',
  'positive_emotion_response',
];

@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly emotionsService: EmotionsService,
    private readonly aiService: AiService,
    private readonly spotifyService: SpotifyService,
    private readonly usersService: UsersService,
    private readonly preferencesService: PreferencesService,
    private readonly redisService: RedisService,
    private readonly cryptoService: CryptoService,
  ) {}

  async recommend(userId: string): Promise<PlaylistResDto> {
    const emotion = await this.emotionsService.findTodayLatest(userId);
    if (!emotion) {
      throw new NotFoundException('No emotion analysis found for today');
    }

    const preference = await this.preferencesService.findByUserId(userId);
    const comment = preference?.data
      ? this.toPreferenceText(preference.data)
      : null;

    const { keywords, title } = await this.extractKeywordsCached(
      emotion.emotions,
      comment,
    );
    if (!keywords?.trim()) {
      throw new NotFoundException('No music keywords available');
    }

    const query = keywords.replace(/\s*\|\s*/g, ', ');
    const tracks = await this.spotifyService.searchTracks(query);
    if (tracks.length === 0) {
      throw new NotFoundException('No tracks found');
    }

    const playlist = await this.save(userId, emotion.emotion, title, tracks);
    void this.exportToSpotify(userId, playlist, title, tracks);
    return PlaylistResDto.from(playlist);
  }

  private toPreferenceText(data: Record<string, unknown>): string | null {
    const parts = Object.entries(data)
      .map(([key, value]) => {
        const label = PREFERENCE_LABELS[key] ?? key;
        const text =
          EMOTION_RESPONSE_KEYS.includes(key) && typeof value === 'string'
            ? (EMOTION_RESPONSE_TEXT[value] ?? value)
            : this.stringifyValue(value);
        return text ? `${label}: ${text}` : null;
      })
      .filter((part): part is string => part !== null);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (Array.isArray(value)) {
      return value
        .map((v) => this.stringifyValue(v))
        .filter(Boolean)
        .join(', ');
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if ('min' in obj || 'max' in obj) {
        const min =
          obj.min !== undefined && obj.min !== null
            ? this.stringifyValue(obj.min)
            : '';
        const max =
          obj.max !== undefined && obj.max !== null
            ? this.stringifyValue(obj.max)
            : '';
        if (min && max) return `${min}-${max}`;
        if (min) return `>=${min}`;
        if (max) return `<=${max}`;
        return '';
      }
      return Object.entries(obj)
        .map(([k, v]) => `${k} ${this.stringifyValue(v)}`.trim())
        .filter(Boolean)
        .join(' ');
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  private async extractKeywordsCached(
    emotions: EmotionRatios,
    comment: string | null,
  ): Promise<AiKeywordResult> {
    const key = this.keywordCacheKey(emotions, comment);

    const cached = await this.getCachedKeywords(key);
    if (cached) {
      return cached;
    }

    const result = await this.aiService.extractKeywords(emotions, comment);
    await this.setCachedKeywords(key, result);
    return result;
  }

  private keywordCacheKey(
    emotions: EmotionRatios,
    comment: string | null,
  ): string {
    const safeEmotions = emotions ?? ({} as EmotionRatios);
    const sorted = Object.keys(safeEmotions)
      .sort()
      .reduce<Record<string, number>>((acc, k) => {
        acc[k] = safeEmotions[k as keyof EmotionRatios];
        return acc;
      }, {});
    const hash = createHash('sha256')
      .update(JSON.stringify({ emotions: sorted, comment }))
      .digest('hex');
    return `music:kw:${hash}`;
  }

  private async getCachedKeywords(
    key: string,
  ): Promise<AiKeywordResult | null> {
    try {
      const cached = await this.redisService.get(key);
      return cached ? (JSON.parse(cached) as AiKeywordResult) : null;
    } catch (error) {
      this.logger.warn('Keyword cache read failed', error as Error);
      return null;
    }
  }

  private async setCachedKeywords(
    key: string,
    result: AiKeywordResult,
  ): Promise<void> {
    try {
      await this.redisService.set(
        key,
        JSON.stringify(result),
        KEYWORD_CACHE_TTL,
      );
    } catch (error) {
      this.logger.warn('Keyword cache write failed', error as Error);
    }
  }

  private async exportToSpotify(
    userId: string,
    playlist: Playlist,
    title: string,
    tracks: SpotifyTrack[],
  ): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);
      if (!user?.spotifyRefreshToken) {
        return;
      }

      const refreshToken = this.cryptoService.decrypt(user.spotifyRefreshToken);
      const created = await this.spotifyService.createPlaylist(
        refreshToken,
        user.spotifyId,
        title,
        tracks.map((t) => t.id),
      );

      await this.dataSource.getRepository(Playlist).update(playlist.id, {
        spotifyPlaylistId: created.id,
        spotifyPlaylistUrl: created.url,
      });
    } catch (error) {
      this.logger.warn(
        `Spotify playlist export failed for user ${userId}`,
        error as Error,
      );
    }
  }

  private save(
    userId: string,
    emotionLabel: string,
    title: string,
    tracks: SpotifyTrack[],
  ): Promise<Playlist> {
    return this.dataSource.transaction(async (manager) => {
      const playlist = await manager.save(
        manager.create(Playlist, {
          userId,
          title,
          imageUrl: tracks[0].albumImageUrl ?? undefined,
          emotionLabel,
        }),
      );

      const trackIds = tracks.map((t) => t.id);
      const existing = await manager.find(Song, {
        where: { spotifyTrackId: In(trackIds) },
      });
      const songMap = new Map(existing.map((s) => [s.spotifyTrackId, s]));

      const toInsert = tracks
        .filter((t) => !songMap.has(t.id))
        .map((t) =>
          manager.create(Song, {
            spotifyTrackId: t.id,
            title: t.title,
            artist: JSON.stringify(t.artists),
            albumName: t.albumName,
            albumImageUrl: t.albumImageUrl ?? undefined,
            spotifyUrl: t.spotifyUrl ?? undefined,
            previewUrl: t.previewUrl ?? undefined,
            durationMs: t.durationMs,
          }),
        );
      if (toInsert.length > 0) {
        const inserted = await manager.save(Song, toInsert);
        inserted.forEach((s) => songMap.set(s.spotifyTrackId, s));
      }

      const playlistSongs = tracks.map((t, index) =>
        manager.create(PlaylistSong, {
          playlistId: playlist.id,
          songId: songMap.get(t.id)!.id,
          rank: index,
        }),
      );
      await manager.save(PlaylistSong, playlistSongs);

      return manager.findOneOrFail(Playlist, {
        where: { id: playlist.id },
        relations: ['playlistSongs', 'playlistSongs.song'],
      });
    });
  }
}
