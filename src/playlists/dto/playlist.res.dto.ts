import { Playlist } from '../playlist.entity';

export interface PlaylistTrackDto {
  artists: string[];
  title: string;
  imageUrl: string | null;
  spotifyUrl: string | null;
  duration: string;
}

function parseArtists(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [raw];
  }
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export class PlaylistResDto {
  id: string;
  title: string;
  imageUrl: string | null;
  tracks: PlaylistTrackDto[];

  static from(playlist: Playlist): PlaylistResDto {
    const dto = new PlaylistResDto();
    dto.id = playlist.id;
    dto.title = playlist.title;
    dto.imageUrl = playlist.imageUrl ?? null;
    dto.tracks = [...(playlist.playlistSongs ?? [])]
      .sort((a, b) => a.rank - b.rank)
      .map((ps) => ({
        artists: parseArtists(ps.song.artist),
        title: ps.song.title,
        imageUrl: ps.song.albumImageUrl ?? null,
        spotifyUrl: ps.song.spotifyUrl ?? null,
        duration: formatDuration(ps.song.durationMs),
      }));
    return dto;
  }
}
