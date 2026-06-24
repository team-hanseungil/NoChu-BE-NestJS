import { Expose, plainToInstance } from 'class-transformer';
import { UserPreference } from '../user-preference.entity';

export class PreferenceResDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  data: Record<string, unknown>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static from(preference: UserPreference): PreferenceResDto {
    return plainToInstance(PreferenceResDto, preference, {
      excludeExtraneousValues: true,
    });
  }
}
