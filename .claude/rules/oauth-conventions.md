# OAuth Conventions

## Strategy Priority

1. Spotify OAuth — primary
2. Google OAuth — fallback (used when Spotify credentials are missing or unavailable)

## Packages

```
@nestjs/passport
passport-spotify
passport-google-oauth20
@nestjs/jwt
passport-jwt
```

## Callback URLs

| Provider | Callback Path |
|----------|---------------|
| Spotify | `/auth/spotify/callback` |
| Google | `/auth/google/callback` |

## Passport Strategy Example

```typescript
@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('SPOTIFY_CLIENT_ID'),
      clientSecret: configService.get('SPOTIFY_CLIENT_SECRET'),
      callbackURL: configService.get('SPOTIFY_CALLBACK_URL'),
      scope: ['user-read-email', 'user-read-private'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    return this.authService.findOrCreateUser({
      email: profile.emails[0].value,
      provider: 'spotify',
      providerId: profile.id,
    });
  }
}
```

## Auth Controller

```typescript
@Controller('auth')
export class AuthController {
  @Get('spotify')
  @UseGuards(AuthGuard('spotify'))
  spotifyLogin() {}

  @Get('spotify/callback')
  @UseGuards(AuthGuard('spotify'))
  spotifyCallback(@Req() req: Request) {
    return this.authService.login(req.user as User);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request) {
    return this.authService.login(req.user as User);
  }
}
```

## Token Issuance

OAuth 성공 후 자체 JWT 발급 (access token + refresh token 쌍).

```typescript
async login(user: User): Promise<{ accessToken: string; refreshToken: string }> {
  const payload: JwtPayload = { sub: user.id, email: user.email };

  const accessToken = this.jwtService.sign(payload, {
    expiresIn: '15m',
  });

  const refreshToken = this.jwtService.sign(payload, {
    expiresIn: '7d',
    secret: this.configService.get('JWT_REFRESH_SECRET'),
  });

  await this.usersService.updateRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
}
```

## JWT Payload

```typescript
interface JwtPayload {
  sub: string;
  email: string;
}
```

## Refresh Token Storage

Refresh token은 DB에 해시값으로 저장. 원본 저장 금지.

```typescript
async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const hashed = await bcrypt.hash(refreshToken, 10);
  await this.usersRepository.update(userId, { refreshToken: hashed });
}
```
