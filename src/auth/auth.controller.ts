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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SpotifyLoginReqDto } from './dto/spotify-login.req.dto';
import { RefreshTokenReqDto } from './dto/refresh-token.req.dto';
import { TokenResDto } from './dto/token.res.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('spotify')
  @ApiOperation({ summary: 'Spotify 인가 코드로 로그인/회원가입' })
  @ApiOkResponse({ type: TokenResDto })
  @HttpCode(HttpStatus.OK)
  spotifyLogin(@Body() dto: SpotifyLoginReqDto): Promise<TokenResDto> {
    return this.authService.loginWithCode(dto.code);
  }

  @Post('refresh')
  @ApiOperation({ summary: '리프레시 토큰으로 액세스 토큰 재발급' })
  @ApiOkResponse({ type: TokenResDto })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenReqDto): Promise<TokenResDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Delete('logout')
  @ApiOperation({ summary: '로그아웃 (리프레시 토큰 무효화)' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request): Promise<void> {
    const { sub } = req.user as JwtPayload;
    return this.authService.logout(sub);
  }
}
