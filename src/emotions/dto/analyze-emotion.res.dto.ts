import { Expose, plainToInstance } from 'class-transformer';
import { EmotionRatios } from '../../ai/ai.service';
import { Emotion } from '../emotion.entity';

export class AnalyzeEmotionResDto {
  @Expose()
  imageUrl: string;

  @Expose()
  emotions: EmotionRatios;

  @Expose()
  emotion: string;

  @Expose()
  comment: string | null;

  static from(emotion: Emotion): AnalyzeEmotionResDto {
    return plainToInstance(AnalyzeEmotionResDto, emotion, {
      excludeExtraneousValues: true,
    });
  }
}
