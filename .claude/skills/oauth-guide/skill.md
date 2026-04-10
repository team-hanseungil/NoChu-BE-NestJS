# OAuth Implementation Guide

## Overall Flow

1. Client redirects to `/auth/spotify` or `/auth/google`
2. Passport strategy handles provider redirect and callback
3. On callback, extract provider profile and upsert user in DB
4. Issue JWT access token (15m) and refresh token (7d)
5. Return tokens to client (e.g., via redirect with query params or JSON response)

---

## Spotify OAuth Setup

Strategy using `passport-spotify`:

```typescript
@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: process.env.SPOTIFY_CALLBACK_URL,
      scope: ['user-read-email', 'user-read-private'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return this.authService.findOrCreateUser(profile);
  }
}
```

Required env vars:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_CALLBACK_URL`

---

## Google OAuth Fallback Setup

Strategy using `passport-google-oauth20`:

```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return this.authService.findOrCreateUser(profile);
  }
}
```

Required env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

---

## Guard Usage

```typescript
@Get('spotify')
@UseGuards(AuthGuard('spotify'))
spotifyLogin() {}

@Get('spotify/callback')
@UseGuards(AuthGuard('spotify'))
spotifyCallback(@Request() req) {
  return this.authService.login(req.user);
}

@Get('google')
@UseGuards(AuthGuard('google'))
googleLogin() {}

@Get('google/callback')
@UseGuards(AuthGuard('google'))
googleCallback(@Request() req) {
  return this.authService.login(req.user);
}
```

---

## JWT Issuance After OAuth

```typescript
async login(user: UserEntity) {
  const payload = { sub: user.id, email: user.email };
  const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
  const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
  await this.storeRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}
```

---

## Refresh Token Storage

Hash with bcrypt before storing in the user entity.

```typescript
async storeRefreshToken(userId: string, refreshToken: string) {
  const hashed = await bcrypt.hash(refreshToken, 10);
  await this.usersRepository.update(userId, { hashedRefreshToken: hashed });
}
```

---

## JWT Guard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Configure in the JWT strategy:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email };
  }
}
```

---

## Required Packages

```
@nestjs/passport
passport
passport-spotify
passport-google-oauth20
passport-jwt
@nestjs/jwt
bcrypt
@types/passport-google-oauth20
@types/passport-jwt
@types/bcrypt
```
