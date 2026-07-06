import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { EmotionsModule } from '../emotions/emotions.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';

@Module({
  imports: [EmotionsModule, AiModule, SpotifyModule],
  controllers: [MusicController],
  providers: [MusicService],
})
export class MusicModule {}
