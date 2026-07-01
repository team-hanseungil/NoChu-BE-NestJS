import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    if (analyzed.status === 'rejected') {
      if (uploaded.status === 'fulfilled') {
        await this.s3Service.delete(uploaded.value).catch(() => undefined);
      }
      throw analyzed.reason;
    }
    if (uploaded.status === 'rejected') {
      throw uploaded.reason;
    }

    const imageUrl = uploaded.value;
    const result = analyzed.value;

    const emotionValues = result.emotions ? Object.values(result.emotions) : [];
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

    return this.emotionsRepository.save(emotion);
  }

  async findHistory(userId: string): Promise<EmotionHistoryResDto> {
    const records = await this.emotionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return EmotionHistoryResDto.from(records);
  }
}
