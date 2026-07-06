import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { Playlist } from './playlist.entity';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistsRepository: Repository<Playlist>,
  ) {}

  findRecentByUserId(userId: string): Promise<Playlist[]> {
    return this.playlistsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['playlistSongs', 'playlistSongs.song'],
    });
  }

  async findOneByUserId(userId: string, id: string): Promise<Playlist> {
    const playlist = await this.playlistsRepository.findOne({
      where: { id, userId },
      relations: ['playlistSongs', 'playlistSongs.song'],
    });
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }
    return playlist;
  }

  create(data: Partial<Playlist>): Promise<Playlist> {
    const playlist = this.playlistsRepository.create(data);
    return this.playlistsRepository.save(playlist);
  }
}
