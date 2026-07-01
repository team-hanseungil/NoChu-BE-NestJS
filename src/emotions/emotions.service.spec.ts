import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { EmotionsService } from './emotions.service';
import { Emotion } from './emotion.entity';
import { S3Service } from '../storage/s3.service';
import { AiService } from '../ai/ai.service';

describe('EmotionsService', () => {
  let service: EmotionsService;
  let repository: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let s3Service: { upload: jest.Mock };
  let aiService: { analyzeEmotion: jest.Mock };

  const userId = 'user-1';
  const file = {
    buffer: Buffer.from('image-bytes'),
    mimetype: 'image/png',
    originalname: 'face.png',
  } as Express.Multer.File;

  const aiResult = {
    emotions: {
      happy: 0.7,
      surprise: 0.1,
      anger: 0,
      anxiety: 0.1,
      hurt: 0,
      sad: 0.1,
    },
    emotion: 'happy',
    comment: '기분 좋아 보여요',
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn((e: Partial<Emotion>) => e as Emotion),
      save: jest.fn((e: Emotion) => Promise.resolve(e)),
      find: jest.fn(),
    };
    s3Service = {
      upload: jest.fn().mockResolvedValue('https://bucket.s3/emotions/x.png'),
    };
    aiService = { analyzeEmotion: jest.fn().mockResolvedValue(aiResult) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EmotionsService,
        { provide: getRepositoryToken(Emotion), useValue: repository },
        { provide: S3Service, useValue: s3Service },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    service = moduleRef.get(EmotionsService);
  });

  it('uploads the image, analyzes it, and saves the result', async () => {
    const result = await service.analyze(userId, file);

    expect(s3Service.upload).toHaveBeenCalledWith(
      file.buffer,
      'image/png',
      'emotions',
    );
    expect(aiService.analyzeEmotion).toHaveBeenCalledWith(
      file.buffer,
      'face.png',
      'image/png',
    );
    expect(repository.save).toHaveBeenCalled();
    expect(result.imageUrl).toBe('https://bucket.s3/emotions/x.png');
    expect(result.emotion).toBe('happy');
    expect(result.confidence).toBe(70);
  });

  it('throws BadRequestException when no image is provided', async () => {
    await expect(service.analyze(userId, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('computes history stats (total, average, streak)', async () => {
    const day = (s: string) => new Date(`${s}T00:00:00Z`);
    repository.find.mockResolvedValue([
      {
        id: 'e2',
        emotion: 'sad',
        confidence: 60,
        createdAt: day('2026-07-01'),
      },
      {
        id: 'e1',
        emotion: 'happy',
        confidence: 80,
        createdAt: day('2026-06-30'),
      },
    ] as Emotion[]);

    const result = await service.findHistory(userId);

    expect(result.totalRecords).toBe(2);
    expect(result.averageConfidence).toBe(70);
    expect(result.streak).toBe(2);
    expect(result.emotions[0].date).toBe('2026-07-01');
  });
});
