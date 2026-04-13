import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Playlist } from '../playlists/playlist.entity';
import { UserPreference } from '../preferences/user-preference.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  spotifyId: string;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Playlist, (playlist) => playlist.user, { cascade: true })
  playlists: Playlist[];

  @OneToOne(() => UserPreference, (preference) => preference.user, { cascade: true })
  preference: UserPreference;
}
