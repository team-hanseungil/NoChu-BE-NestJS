import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song } from './song.entity';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,
  ) {}

  findBySpotifyTrackId(spotifyTrackId: string): Promise<Song | null> {
    return this.songsRepository.findOne({ where: { spotifyTrackId } });
  }

  create(data: Partial<Song>): Promise<Song> {
    const song = this.songsRepository.create(data);
    return this.songsRepository.save(song);
  }
}
