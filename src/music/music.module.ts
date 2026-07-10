import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { EmotionsModule } from '../emotions/emotions.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { UsersModule } from '../users/users.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { RedisModule } from '../redis/redis.module';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';

@Module({
  imports: [
    EmotionsModule,
    AiModule,
    SpotifyModule,
    UsersModule,
    PreferencesModule,
    RedisModule,
  ],
  controllers: [MusicController],
  providers: [MusicService],
})
export class MusicModule {}
