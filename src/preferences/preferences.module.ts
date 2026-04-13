import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreference } from './user-preference.entity';
import { PreferencesService } from './preferences.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreference])],
  providers: [PreferencesService],
  exports: [PreferencesService],
})
export class PreferencesModule {}
