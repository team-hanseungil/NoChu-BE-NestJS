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
    const comment = preference?.data ? JSON.stringify(preference.data) : null;

    const { keywords, title } = await this.extractKeywordsCached(
      emotion.emotions,
      comment,
    );
    if (!keywords?.trim()) {
      throw new NotFoundException('No music keywords available');
    }

    const tracks = await this.spotifyService.searchTracks(keywords);
    if (tracks.length === 0) {
      throw new NotFoundException('No tracks found');
    }

    const playlist = await this.save(userId, emotion.emotion, title, tracks);
    void this.exportToSpotify(userId, playlist, title, tracks);
    return PlaylistResDto.from(playlist);
  }

  private async extractKeywordsCached(
    emotions: EmotionRatios,
    comment: string | null,
  ): Promise<AiKeywordResult> {
    const hash = createHash('sha256')
      .update(JSON.stringify({ emotions, comment }))
      .digest('hex');
    const key = `music:kw:${hash}`;

    const cached = await this.redisService.get(key);
    if (cached) {
      return JSON.parse(cached) as AiKeywordResult;
    }

    const result = await this.aiService.extractKeywords(emotions, comment);
    await this.redisService.set(key, JSON.stringify(result), KEYWORD_CACHE_TTL);
    return result;
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
