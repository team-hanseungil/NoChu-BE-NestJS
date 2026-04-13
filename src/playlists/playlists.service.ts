import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  create(data: Partial<Playlist>): Promise<Playlist> {
    const playlist = this.playlistsRepository.create(data);
    return this.playlistsRepository.save(playlist);
  }
}
