import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  const user = { id: 'user-1', spotifyId: 'sp-1' } as User;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn((d: Partial<User>) => d as User),
      save: jest.fn((u: User) => Promise.resolve(u)),
      update: jest.fn(),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('finds a user by id', async () => {
    repository.findOne.mockResolvedValue(user);
    await expect(service.findOne('user-1')).resolves.toEqual(user);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('finds a user by spotify id', async () => {
    repository.findOne.mockResolvedValue(user);
    await expect(service.findBySpotifyId('sp-1')).resolves.toEqual(user);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { spotifyId: 'sp-1' },
    });
  });

  it('creates a user', async () => {
    await service.create({ spotifyId: 'sp-2' });
    expect(repository.create).toHaveBeenCalledWith({ spotifyId: 'sp-2' });
    expect(repository.save).toHaveBeenCalled();
  });

  it('updates the spotify refresh token', async () => {
    await service.updateSpotifyRefreshToken('user-1', 'enc-token');
    expect(repository.update).toHaveBeenCalledWith('user-1', {
      spotifyRefreshToken: 'enc-token',
    });
  });
});
