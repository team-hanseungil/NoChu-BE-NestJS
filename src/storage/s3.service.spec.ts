import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';

const CONFIG: Record<string, string> = {
  AWS_STATIC: 'ap-northeast-2',
  AWS_BUCKET: 'nochu-bucket',
  AWS_ACCESS_KEY: 'access',
  AWS_SECRET_KEY: 'secret',
};

describe('S3Service', () => {
  let service: S3Service;
  let send: jest.Mock;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => CONFIG[key]),
    } as unknown as ConfigService;
    service = new S3Service(configService);
    send = jest.fn().mockResolvedValue({});
    (service as unknown as { client: { send: jest.Mock } }).client = { send };
  });

  describe('upload', () => {
    it('puts the object and returns a public URL', async () => {
      const url = await service.upload(
        Buffer.from('img'),
        'image/png',
        'emotions',
      );

      expect(send).toHaveBeenCalledTimes(1);
      const command = send.mock.calls[0][0] as PutObjectCommand;
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input.Bucket).toBe('nochu-bucket');
      expect(command.input.ContentType).toBe('image/png');
      expect(command.input.Key).toMatch(/^emotions\/.+\.png$/);
      expect(url).toMatch(
        /^https:\/\/nochu-bucket\.s3\.ap-northeast-2\.amazonaws\.com\/emotions\/.+\.png$/,
      );
    });

    it('falls back to bin extension for unknown mimetype', async () => {
      const url = await service.upload(Buffer.from('x'), 'application/x', 'p');
      expect(url).toMatch(/\.bin$/);
    });
  });

  describe('delete', () => {
    it('deletes the object by parsing the key from the URL', async () => {
      await service.delete(
        'https://nochu-bucket.s3.ap-northeast-2.amazonaws.com/emotions/abc.png',
      );

      const command = send.mock.calls[0][0] as DeleteObjectCommand;
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input.Bucket).toBe('nochu-bucket');
      expect(command.input.Key).toBe('emotions/abc.png');
    });
  });
});
