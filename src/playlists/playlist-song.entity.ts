import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Playlist } from './playlist.entity';
import { Song } from '../songs/song.entity';

@Entity('playlist_songs')
export class PlaylistSong {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  playlistId: string;

  @Column()
  songId: string;

  @Column()
  rank: number;

  @ManyToOne(() => Playlist, (playlist) => playlist.playlistSongs, { onDelete: 'CASCADE' })
  playlist: Playlist;

  @ManyToOne(() => Song, (song) => song.playlistSongs)
  song: Song;
}
