import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlaylistSong } from '../playlists/playlist-song.entity';

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  spotifyTrackId: string;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column()
  albumName: string;

  @Column({ nullable: true })
  albumImageUrl: string;

  @Column({ nullable: true })
  previewUrl: string;

  @Column()
  durationMs: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PlaylistSong, (playlistSong) => playlistSong.song)
  playlistSongs: PlaylistSong[];
}
