import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { PreferenceData, UserPreference } from './user-preference.entity';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly preferencesRepository: Repository<UserPreference>,
  ) {}

  findByUserId(userId: string): Promise<UserPreference | null> {
    return this.preferencesRepository.findOne({ where: { userId } });
  }

  async getByUserId(userId: string): Promise<UserPreference> {
    const preference = await this.findByUserId(userId);
    if (!preference) {
      throw new NotFoundException('Preference not found');
    }
    return preference;
  }

  async upsert(userId: string, data: PreferenceData): Promise<UserPreference> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      await this.preferencesRepository.update({ userId }, { data });
      return this.getByUserId(userId);
    }
    const preference = this.preferencesRepository.create({ userId, data });
    return this.preferencesRepository.save(preference);
  }

  async patch(
    userId: string,
    partial: Partial<PreferenceData>,
  ): Promise<UserPreference> {
    const preference = await this.getByUserId(userId);
    const merged = { ...preference.data, ...partial };
    await this.preferencesRepository.update({ userId }, { data: merged });
    return this.getByUserId(userId);
  }
}
