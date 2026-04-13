import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { PlaylistSong } from './playlist-song.entity';

@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

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

  @OneToMany(() => PlaylistSong, (playlistSong) => playlistSong.playlist, { cascade: true })
  playlistSongs: PlaylistSong[];
}
