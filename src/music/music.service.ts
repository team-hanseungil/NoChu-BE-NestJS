import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { EmotionsService } from '../emotions/emotions.service';
import { AiService } from '../ai/ai.service';
import { SpotifyService, SpotifyTrack } from '../spotify/spotify.service';
import { Playlist } from '../playlists/playlist.entity';
import { PlaylistSong } from '../playlists/playlist-song.entity';
import { Song } from '../songs/song.entity';
import { PlaylistResDto } from '../playlists/dto/playlist.res.dto';

@Injectable()
export class MusicService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly emotionsService: EmotionsService,
    private readonly aiService: AiService,
    private readonly spotifyService: SpotifyService,
  ) {}

  async recommend(
    userId: string,
    comment: string | null,
  ): Promise<PlaylistResDto> {
    const emotion = await this.emotionsService.findTodayLatest(userId);
    if (!emotion) {
      throw new NotFoundException('No emotion analysis found for today');
    }

    const { keywords, title } = await this.aiService.extractKeywords(
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
    return PlaylistResDto.from(playlist);
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
