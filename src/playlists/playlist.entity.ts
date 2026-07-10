import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationCount,
} from 'typeorm';
import { User } from '../users/user.entity';
import { PlaylistSong } from './playlist-song.entity';

@Index(['userId', 'createdAt'])
@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', nullable: true })
  spotifyPlaylistId: string | null;

  @Column({ type: 'varchar', nullable: true })
  spotifyPlaylistUrl: string | null;

  @Column({ nullable: true })
  emotionLabel: string;

  @Column({ type: 'float', nullable: true })
  faceConfidence: number;

  @Column({ type: 'text', nullable: true })
  textInput: string;

  @Column({ nullable: true })
  textEmotion: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.playlists, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => PlaylistSong, (playlistSong) => playlistSong.playlist, {
    cascade: true,
  })
  playlistSongs: PlaylistSong[];

  @RelationCount((playlist: Playlist) => playlist.playlistSongs)
  playlistSongsCount: number;
}
