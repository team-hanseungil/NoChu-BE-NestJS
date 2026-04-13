import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '../common/exceptions/unauthorized.exception';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { TokenResDto } from './dto/token.res.dto';

const REFRESH_TTL = 7 * 24 * 60 * 60;

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  async loginWithCode(code: string): Promise<TokenResDto> {
    const spotifyTokens = await this.exchangeCode(code);
    const profile = await this.getSpotifyProfile(spotifyTokens.access_token);

    let user = await this.usersService.findBySpotifyId(profile.id);
    if (!user) {
      user = await this.usersService.create({
        spotifyId: profile.id,
        email: profile.email ?? '',
        displayName: profile.display_name,
        profileImageUrl: profile.images?.[0]?.url ?? null,
      });
    }

    return this.issueTokens(user.id, user.email);
  }

  async refresh(token: string): Promise<Pick<TokenResDto, 'accessToken'>> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.redisService.get(`refresh:${payload.sub}`);
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    const isMatch = await bcrypt.compare(token, stored);
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token');

    const accessToken = this.jwtService.sign({ sub: payload.sub, email: payload.email });
    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.redisService.del(`refresh:${userId}`);
  }

  private async issueTokens(userId: string, email: string): Promise<TokenResDto> {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.redisService.set(`refresh:${userId}`, hashed, REFRESH_TTL);

    return { accessToken, refreshToken };
  }

  private async exchangeCode(code: string): Promise<SpotifyTokenResponse> {
    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('SPOTIFY_CALLBACK_URL');

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl!,
      }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to exchange Spotify code');
    }

    return response.json() as Promise<SpotifyTokenResponse>;
  }

  private async getSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch Spotify profile');
    }

    return response.json() as Promise<SpotifyProfile>;
  }
}
