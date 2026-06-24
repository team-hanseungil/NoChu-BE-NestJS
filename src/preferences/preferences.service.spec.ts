import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { PreferencesService } from './preferences.service';
import { PreferenceData, UserPreference } from './user-preference.entity';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let repository: jest.Mocked<Repository<UserPreference>>;

  const userId = 'user-1';
  const data: PreferenceData = {
    genre: ['pop'],
    emotionDirection: [{ emotion: 'sad', direction: 'comfort' }],
    artist: ['IU'],
    language: ['ko'],
    bpm: { min: 80, max: 120 },
  };
  const preference = { id: 'pref-1', userId, data } as UserPreference;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        {
          provide: getRepositoryToken(UserPreference),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PreferencesService);
    repository = module.get(getRepositoryToken(UserPreference));
  });

  describe('getByUserId', () => {
    it('returns the preference when it exists', async () => {
      repository.findOne.mockResolvedValue(preference);
      await expect(service.getByUserId(userId)).resolves.toEqual(preference);
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.getByUserId(userId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('upsert', () => {
    it('creates a new preference when none exists', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(preference);
      repository.save.mockResolvedValue(preference);

      const result = await service.upsert(userId, data);

      expect(repository.create).toHaveBeenCalledWith({ userId, data });
      expect(repository.save).toHaveBeenCalledWith(preference);
      expect(repository.update).not.toHaveBeenCalled();
      expect(result).toEqual(preference);
    });

    it('overwrites data when a preference already exists', async () => {
      repository.findOne.mockResolvedValue(preference);

      await service.upsert(userId, data);

      expect(repository.update).toHaveBeenCalledWith({ userId }, { data });
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('patch', () => {
    it('merges partial data into existing preference', async () => {
      repository.findOne.mockResolvedValue(preference);

      await service.patch(userId, { genre: ['jazz'] });

      expect(repository.update).toHaveBeenCalledWith(
        { userId },
        { data: { ...data, genre: ['jazz'] } },
      );
    });

    it('throws NotFoundException when preference is missing', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(
        service.patch(userId, { genre: ['jazz'] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
