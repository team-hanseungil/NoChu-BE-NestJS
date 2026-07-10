import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PlaylistsService } from './playlists.service';
import { PlaylistListResDto } from './dto/playlist-list.res.dto';
import { PlaylistResDto } from './dto/playlist.res.dto';

@ApiTags('playlists')
@ApiBearerAuth()
@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: '내 플레이리스트 목록 조회' })
  async findAll(@Req() req: Request): Promise<PlaylistListResDto> {
    const { sub } = req.user as JwtPayload;
    const playlists = await this.playlistsService.findRecentByUserId(sub);
    return PlaylistListResDto.from(playlists);
  }

  @Get(':id')
  @ApiOperation({ summary: '플레이리스트 상세 조회' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlaylistResDto> {
    const { sub } = req.user as JwtPayload;
    const playlist = await this.playlistsService.findOneByUserId(sub, id);
    return PlaylistResDto.from(playlist);
  }
}
