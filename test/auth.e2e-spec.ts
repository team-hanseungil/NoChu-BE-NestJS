import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UsersService } from '../src/users/users.service';
import { RedisService } from '../src/redis/redis.service';
import { PreferencesService } from '../src/preferences/preferences.service';
import { PreferencesController } from '../src/preferences/preferences.controller';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const TEST_ENV = {
  JWT_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  SPOTIFY_CLIENT_ID: 'client-id',
  SPOTIFY_CLIENT_SECRET: 'client-secret',
  SPOTIFY_CALLBACK_URL: 'nochu://auth/spotify/callback',
};

const SPOTIFY_PROFILE = {
  id: 'spotify-123',
  display_name: 'Test User',
  email: 'test@example.com',
  images: [{ url: 'https://img.example/avatar.png' }],
};

const VALID_PREFERENCE = {
  genre: ['pop'],
  emotionDirection: [{ emotion: 'sad', direction: 'comfort' }],
  artist: ['IU'],
  language: ['ko'],
  bpm: { min: 80, max: 120 },
};

interface StoredUser {
  id: string;
  spotifyId: string;
  email: string | null;
  displayName: string;
  profileImageUrl: string | null;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  onboarded: boolean;
}

class FakeUsersService {
  private store = new Map<string, StoredUser>();
  private seq = 0;
  createSpy = jest.fn();

  reset() {
    this.store.clear();
    this.seq = 0;
    this.createSpy.mockClear();
  }

  findBySpotifyId(spotifyId: string): Promise<StoredUser | null> {
    const found = [...this.store.values()].find(
      (u) => u.spotifyId === spotifyId,
    );
    return Promise.resolve(found ?? null);
  }

  create(data: Omit<StoredUser, 'id'>): Promise<StoredUser> {
    this.createSpy(data);
    const user: StoredUser = { id: `user-${++this.seq}`, ...data };
    this.store.set(user.id, user);
    return Promise.resolve(user);
  }
}

class FakeRedisService {
  private store = new Map<string, string>();

  reset() {
    this.store.clear();
  }

  set(key: string, value: string, _ttl?: number): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.store.get(key) ?? null);
  }

  del(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }
}

class FakePreferencesService {
  private store = new Map<string, Record<string, unknown>>();

  reset() {
    this.store.clear();
  }

  findByUserId(userId: string): Promise<Record<string, unknown> | null> {
    return Promise.resolve(this.store.get(userId) ?? null);
  }

  upsert(
    userId: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const preference = { id: `pref-${userId}`, userId, data };
    this.store.set(userId, preference);
    return Promise.resolve(preference);
  }
}

function jsonResponse(ok: boolean, body: unknown): Response {
  return { ok, json: () => Promise.resolve(body) } as unknown as Response;
}

function mockSpotifySuccess(fetchMock: jest.SpyInstance) {
  fetchMock
    .mockResolvedValueOnce(
      jsonResponse(true, {
        access_token: 'spotify-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'spotify-refresh-token',
        scope: '',
      }),
    )
    .mockResolvedValueOnce(jsonResponse(true, SPOTIFY_PROFILE));
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let users: FakeUsersService;
  let redis: FakeRedisService;
  let prefs: FakePreferencesService;
  let fetchMock: jest.SpyInstance;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => TEST_ENV],
        }),
        PassportModule,
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: '15m' },
          }),
        }),
      ],
      controllers: [AuthController, PreferencesController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: UsersService, useClass: FakeUsersService },
        { provide: RedisService, useClass: FakeRedisService },
        { provide: PreferencesService, useClass: FakePreferencesService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    users = app.get(UsersService);
    redis = app.get(RedisService);
    prefs = app.get(PreferencesService);
  });

  beforeEach(() => {
    users.reset();
    redis.reset();
    prefs.reset();
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(): Promise<TokenResponse> {
    mockSpotifySuccess(fetchMock);
    const res = await request(app.getHttpServer())
      .post('/auth/spotify')
      .send({ code: 'auth-code' })
      .expect(200);
    return res.body as TokenResponse;
  }

  describe('POST /auth/spotify', () => {
    it('creates a new user on first login and returns tokens', async () => {
      mockSpotifySuccess(fetchMock);

      const res = await request(app.getHttpServer())
        .post('/auth/spotify')
        .send({ code: 'auth-code' })
        .expect(200);

      const body = res.body as TokenResponse;
      expect(typeof body.accessToken).toBe('string');
      expect(typeof body.refreshToken).toBe('string');
      expect(body.onboarded).toBe(false);
      expect(users.createSpy).toHaveBeenCalledTimes(1);
      expect(users.createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          spotifyId: SPOTIFY_PROFILE.id,
          email: SPOTIFY_PROFILE.email,
          displayName: SPOTIFY_PROFILE.display_name,
        }),
      );
    });

    it('reuses the existing user on repeat login', async () => {
      await login();
      await login();

      expect(users.createSpy).toHaveBeenCalledTimes(1);
    });

    it('returns 401 when Spotify code exchange fails', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(false, {}));

      await request(app.getHttpServer())
        .post('/auth/spotify')
        .send({ code: 'bad-code' })
        .expect(401);
    });

    it('returns 400 when code is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/spotify')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('issues new tokens for a valid refresh token', async () => {
      const { refreshToken } = await login();

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const body = res.body as TokenResponse;
      expect(typeof body.accessToken).toBe('string');
      expect(typeof body.refreshToken).toBe('string');
    });

    it('returns 401 for an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'not-a-valid-token' })
        .expect(401);
    });
  });

  describe('DELETE /auth/logout', () => {
    it('invalidates the refresh token and returns 204', async () => {
      const { accessToken, refreshToken } = await login();

      await request(app.getHttpServer())
        .delete('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('returns 401 without an access token', async () => {
      await request(app.getHttpServer()).delete('/auth/logout').expect(401);
    });
  });

  describe('onboarding flag', () => {
    it('is false on first login and true after preferences are submitted', async () => {
      const first = await login();
      expect(first.onboarded).toBe(false);

      await request(app.getHttpServer())
        .post('/preferences')
        .set('Authorization', `Bearer ${first.accessToken}`)
        .send(VALID_PREFERENCE)
        .expect(201);

      const second = await login();
      expect(second.onboarded).toBe(true);
    });
  });
});
