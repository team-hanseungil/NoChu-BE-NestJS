import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { S3Service } from '../storage/s3.service';
import { Emotion } from './emotion.entity';
import { EmotionHistoryResDto } from './dto/emotion-history.res.dto';

@Injectable()
export class EmotionsService {
  constructor(
    @InjectRepository(Emotion)
    private readonly emotionsRepository: Repository<Emotion>,
    private readonly s3Service: S3Service,
    private readonly aiService: AiService,
  ) {}

  async analyze(userId: string, image?: Express.Multer.File): Promise<Emotion> {
    if (!image) {
      throw new BadRequestException('image is required');
    }

    const [uploaded, analyzed] = await Promise.allSettled([
      this.s3Service.upload(image.buffer, image.mimetype, 'emotions'),
      this.aiService.analyzeEmotion(
        image.buffer,
        image.originalname,
        image.mimetype,
      ),
    ]);

    let imageUrl: string | undefined;
    try {
      if (uploaded.status === 'rejected') {
        throw uploaded.reason;
      }
      imageUrl = uploaded.value;

      if (analyzed.status === 'rejected') {
        throw analyzed.reason;
      }
      const result = analyzed.value;

      if (!result?.emotions || !result.emotion) {
        throw new ServiceUnavailableException(
          'AI server returned an invalid response',
        );
      }

      const emotionValues = Object.values(result.emotions);
      const confidence = emotionValues.length
        ? Math.round(Math.max(...emotionValues) * 100)
        : 0;

      const emotion = this.emotionsRepository.create({
        userId,
        imageUrl,
        emotions: result.emotions,
        emotion: result.emotion,
        comment: result.comment,
        confidence,
      });

      return await this.emotionsRepository.save(emotion);
    } catch (error) {
      if (imageUrl) {
        await this.s3Service.delete(imageUrl).catch(() => undefined);
      }
      throw error;
    }
  }

  findTodayLatest(userId: string): Promise<Emotion | null> {
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const kstNow = new Date(Date.now() + KST_OFFSET);
    kstNow.setUTCHours(0, 0, 0, 0);
    const start = new Date(kstNow.getTime() - KST_OFFSET);

    return this.emotionsRepository.findOne({
      where: { userId, createdAt: MoreThanOrEqual(start) },
      order: { createdAt: 'DESC' },
    });
  }

  async findHistory(userId: string): Promise<EmotionHistoryResDto> {
    const records = await this.emotionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return EmotionHistoryResDto.from(records);
  }
}
