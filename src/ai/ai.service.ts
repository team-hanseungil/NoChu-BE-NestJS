import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmotionRatios {
  happy: number;
  surprise: number;
  anger: number;
  anxiety: number;
  hurt: number;
  sad: number;
}

export interface AiEmotionResult {
  emotions: EmotionRatios;
  emotion: string;
  comment: string;
}

export interface AiKeywordResult {
  keywords: string;
  title: string;
}

const TIMEOUT_MS = 10_000;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('AI_SERVER_URL')!;
  }

  async analyzeEmotion(
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<AiEmotionResult> {
    const form = new FormData();
    form.append(
      'image',
      new Blob([new Uint8Array(buffer)], { type: mimetype }),
      filename,
    );

    return this.request<AiEmotionResult>('/api/ai/emotions', { body: form });
  }

  async extractKeywords(
    emotions: EmotionRatios,
    comment: string | null,
  ): Promise<AiKeywordResult> {
    return this.request<AiKeywordResult>('/api/ai/keywords', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...emotions, comment }),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        signal: controller.signal,
        ...init,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.error(
          `AI server ${path} responded ${response.status}: ${body}`,
        );
        throw new ServiceUnavailableException('AI server request failed');
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`AI server ${path} request failed`, error as Error);
      throw new ServiceUnavailableException('AI server is unavailable');
    } finally {
      clearTimeout(timer);
    }
  }
}
