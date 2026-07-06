import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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

      for (const [index, track] of tracks.entries()) {
        let song = await manager.findOne(Song, {
          where: { spotifyTrackId: track.id },
        });
        if (!song) {
          song = await manager.save(
            manager.create(Song, {
              spotifyTrackId: track.id,
              title: track.title,
              artist: JSON.stringify(track.artists),
              albumName: track.albumName,
              albumImageUrl: track.albumImageUrl ?? undefined,
              spotifyUrl: track.spotifyUrl ?? undefined,
              previewUrl: track.previewUrl ?? undefined,
              durationMs: track.durationMs,
            }),
          );
        }

        await manager.save(
          manager.create(PlaylistSong, {
            playlistId: playlist.id,
            songId: song.id,
            rank: index,
          }),
        );
      }

      return manager.findOneOrFail(Playlist, {
        where: { id: playlist.id },
        relations: ['playlistSongs', 'playlistSongs.song'],
      });
    });
  }
}
