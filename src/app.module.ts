import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { UsersModule } from './users/users.module';
import { SongsModule } from './songs/songs.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { PreferencesModule } from './preferences/preferences.module';
import { EmotionsModule } from './emotions/emotions.module';
import { MusicModule } from './music/music.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CryptoModule,
    DatabaseModule,
    RedisModule,
    UsersModule,
    SongsModule,
    PlaylistsModule,
    PreferencesModule,
    EmotionsModule,
    MusicModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
