import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { PlaylistsService } from './playlists.service';
import { Playlist } from './playlist.entity';

describe('PlaylistsService', () => {
  let service: PlaylistsService;
  let repository: { find: jest.Mock; findOne: jest.Mock };

  const userId = 'user-1';
  const playlist = { id: 'pl-1', userId, title: 'Mix' } as Playlist;

  beforeEach(async () => {
    repository = { find: jest.fn(), findOne: jest.fn() };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        { provide: getRepositoryToken(Playlist), useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(PlaylistsService);
  });

  describe('findRecentByUserId', () => {
    it('returns recent playlists for the user', async () => {
      repository.find.mockResolvedValue([playlist]);
      await expect(service.findRecentByUserId(userId)).resolves.toEqual([
        playlist,
      ]);
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId }, take: 20 }),
      );
    });
  });

  describe('findOneByUserId', () => {
    it('returns the playlist when owned by the user', async () => {
      repository.findOne.mockResolvedValue(playlist);
      await expect(service.findOneByUserId(userId, 'pl-1')).resolves.toEqual(
        playlist,
      );
      expect(repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'pl-1', userId } }),
      );
    });

    it('throws NotFoundException when not found or not owned', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(
        service.findOneByUserId(userId, 'pl-x'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
