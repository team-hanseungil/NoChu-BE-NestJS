import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { EmotionsModule } from '../emotions/emotions.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { UsersModule } from '../users/users.module';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';

@Module({
  imports: [EmotionsModule, AiModule, SpotifyModule, UsersModule],
  controllers: [MusicController],
  providers: [MusicService],
})
export class MusicModule {}
