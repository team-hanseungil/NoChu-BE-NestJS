import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from './user-preference.entity';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly preferencesRepository: Repository<UserPreference>,
  ) {}

  findByUserId(userId: string): Promise<UserPreference | null> {
    return this.preferencesRepository.findOne({ where: { userId } });
  }

  create(data: Partial<UserPreference>): Promise<UserPreference> {
    const preference = this.preferencesRepository.create(data);
    return this.preferencesRepository.save(preference);
  }

  async update(userId: string, data: Partial<UserPreference>): Promise<void> {
    await this.preferencesRepository.update({ userId }, data);
  }
}
