import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('ENCRYPTION_KEY')!;
    this.key = scryptSync(secret, 'nochu-crypto', 32);
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(cipherText: string): string {
    const [ivB64, tagB64, dataB64] = cipherText.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8',
    );
  }
}
