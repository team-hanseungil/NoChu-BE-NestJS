import { Expose, plainToInstance } from 'class-transformer';
import { PreferenceData, UserPreference } from '../user-preference.entity';

export class PreferenceResDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  data: PreferenceData;

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
