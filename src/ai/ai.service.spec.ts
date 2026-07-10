import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { AiService, EmotionRatios } from './ai.service';

function jsonResponse(ok: boolean, body: unknown): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

const emotions: EmotionRatios = {
  happy: 0.7,
  surprise: 0.1,
  anger: 0,
  sad: 0.2,
};

describe('AiService', () => {
  let service: AiService;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    const configService: Partial<ConfigService> = {
      get: jest.fn(() => 'http://ai-server:8000/'),
    };
    service = new AiService(configService as ConfigService);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('strips a trailing slash from the base URL', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(true, { keywords: 'k', title: 't' }),
    );
    await service.extractKeywords(emotions, null);

    const url = (fetchMock.mock.calls as [string][])[0][0];
    expect(url).toBe('http://ai-server:8000/api/ai/keywords');
  });

  describe('extractKeywords', () => {
    it('posts emotions and comment, returns keyword result', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(true, { keywords: 'joyful pop', title: 'Bright' }),
      );

      const result = await service.extractKeywords(
        emotions,
        '{"genre":["pop"]}',
      );

      expect(result).toEqual({ keywords: 'joyful pop', title: 'Bright' });
      const body = (fetchMock.mock.calls as [string, RequestInit][])[0][1]
        .body as string;
      expect(JSON.parse(body)).toEqual({
        ...emotions,
        comment: '{"genre":["pop"]}',
      });
    });

    it('throws ServiceUnavailable when AI returns an error status', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(false, {}));
      await expect(
        service.extractKeywords(emotions, null),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('throws ServiceUnavailable when fetch rejects (network/timeout)', async () => {
      fetchMock.mockRejectedValueOnce(new Error('aborted'));
      await expect(
        service.extractKeywords(emotions, null),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('analyzeEmotion', () => {
    it('posts multipart form and returns emotion result', async () => {
      const aiResult = { emotions, emotion: 'happy', comment: '좋아 보여요' };
      fetchMock.mockResolvedValueOnce(jsonResponse(true, aiResult));

      const result = await service.analyzeEmotion(
        Buffer.from('img'),
        'face.png',
        'image/png',
      );

      expect(result).toEqual(aiResult);
      const url = (fetchMock.mock.calls as [string][])[0][0];
      expect(url).toBe('http://ai-server:8000/api/ai/emotions');
    });
  });
});
