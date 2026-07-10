import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    const configService = {
      get: jest.fn(() => 'test-encryption-secret'),
    } as unknown as ConfigService;
    service = new CryptoService(configService);
  });

  it('decrypts what it encrypts (round-trip)', () => {
    const plain = 'spotify-refresh-token-abc123';
    const encrypted = service.encrypt(plain);

    expect(encrypted).not.toContain(plain);
    expect(service.decrypt(encrypted)).toBe(plain);
  });

  it('produces different ciphertext for the same input (random IV)', () => {
    const a = service.encrypt('same');
    const b = service.encrypt('same');
    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe('same');
    expect(service.decrypt(b)).toBe('same');
  });

  it('throws when the ciphertext is tampered', () => {
    const encrypted = service.encrypt('secret');
    const [iv, tag, data] = encrypted.split(':');
    const tampered = [iv, tag, Buffer.from('zzzz').toString('base64')].join(
      ':',
    );
    expect(() =>
      service.decrypt(`${iv}:${tag}:${tampered.split(':')[2]}`),
    ).toThrow();
    expect(data).toBeDefined();
  });
});
