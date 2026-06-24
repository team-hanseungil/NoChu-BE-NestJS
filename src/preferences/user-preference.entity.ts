import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export interface EmotionDirection {
  emotion: string;
  direction: string;
}

export interface BpmRange {
  min: number;
  max: number;
}

export interface PreferenceData {
  genre: string[];
  emotionDirection: EmotionDirection[];
  artist: string[];
  language: string[];
  bpm: BpmRange;
}

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ type: 'jsonb' })
  data: PreferenceData;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.preference, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
