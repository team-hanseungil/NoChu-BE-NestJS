import { Playlist } from '../playlist.entity';

export interface PlaylistSummaryDto {
  id: string;
  title: string;
  emotion: string | null;
  imageUrl: string | null;
  count: number;
  createdAt: Date;
}

export class PlaylistListResDto {
  playlists: PlaylistSummaryDto[];

  static from(playlists: Playlist[]): PlaylistListResDto {
    const dto = new PlaylistListResDto();
    dto.playlists = playlists.map((p) => ({
      id: p.id,
      title: p.title,
      emotion: p.emotionLabel ?? null,
      imageUrl: p.imageUrl ?? null,
      count: p.playlistSongsCount ?? 0,
      createdAt: p.createdAt,
    }));
    return dto;
  }
}
