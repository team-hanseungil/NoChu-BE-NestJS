import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { MusicService } from './music.service';
import { MusicRecommendationReqDto } from './dto/music-recommendation.req.dto';
import { PlaylistResDto } from '../playlists/dto/playlist.res.dto';

@ApiTags('music')
@ApiBearerAuth()
@Controller('music')
@UseGuards(JwtAuthGuard)
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Post()
  @ApiOperation({ summary: '오늘 감정 기반 음악 추천 및 플레이리스트 생성' })
  recommend(
    @Req() req: Request,
    @Body() dto: MusicRecommendationReqDto,
  ): Promise<PlaylistResDto> {
    const { sub } = req.user as JwtPayload;
    return this.musicService.recommend(sub, dto.comment ?? null);
  }
}
