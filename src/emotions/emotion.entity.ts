import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmotionRatios } from '../ai/ai.service';

@Entity('emotions')
export class Emotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  emotion: string;

  @Column({ type: 'jsonb' })
  emotions: EmotionRatios;

  @Column()
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'int' })
  confidence: number;

  @CreateDateColumn()
  createdAt: Date;
}
