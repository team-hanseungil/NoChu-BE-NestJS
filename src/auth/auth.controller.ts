import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SpotifyLoginReqDto } from './dto/spotify-login.req.dto';
import { RefreshTokenReqDto } from './dto/refresh-token.req.dto';
import { TokenResDto } from './dto/token.res.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('spotify')
  @HttpCode(HttpStatus.OK)
  spotifyLogin(@Body() dto: SpotifyLoginReqDto): Promise<TokenResDto> {
    return this.authService.loginWithCode(dto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenReqDto): Promise<TokenResDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Delete('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request): Promise<void> {
    const { sub } = req.user as JwtPayload;
    return this.authService.logout(sub);
  }
}
