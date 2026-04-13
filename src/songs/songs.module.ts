import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './song.entity';
import { SongsService } from './songs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Song])],
  providers: [SongsService],
  exports: [SongsService],
})
export class SongsModule {}
