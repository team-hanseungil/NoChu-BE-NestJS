import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { PreferencesController } from '../src/preferences/preferences.controller';
import { PreferencesService } from '../src/preferences/preferences.service';
import { UserPreference } from '../src/preferences/user-preference.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const TEST_ENV = { JWT_SECRET: 'test-access-secret' };

const SURVEY = {
  genre: ['pop'],
  emotionDirection: [{ emotion: 'sad', direction: 'comfort' }],
  artist: ['IU'],
  language: ['ko'],
  bpm: { min: 80, max: 120 },
};

interface StoredPreference {
  id: string;
  userId: string;
  data: Record<string, unknown>;
}

class FakePreferenceRepository {
  private store = new Map<string, StoredPreference>();

  reset() {
    this.store.clear();
  }

  findOne(options: {
    where: { userId: string };
  }): Promise<StoredPreference | null> {
    return Promise.resolve(this.store.get(options.where.userId) ?? null);
  }

  existsBy(where: { userId: string }): Promise<boolean> {
    return Promise.resolve(this.store.has(where.userId));
  }

  create(data: {
    userId: string;
    data: Record<string, unknown>;
  }): StoredPreference {
    return { id: `pref-${data.userId}`, ...data };
  }

  save(entity: StoredPreference): Promise<StoredPreference> {
    this.store.set(entity.userId, entity);
    return Promise.resolve(entity);
  }
}

describe('Preferences (e2e)', () => {
  let app: INestApplication;
  let repo: FakePreferenceRepository;
  let token: string;

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
      controllers: [PreferencesController],
      providers: [
        PreferencesService,
        JwtStrategy,
        {
          provide: getRepositoryToken(UserPreference),
          useClass: FakePreferenceRepository,
        },
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

    repo = app.get(getRepositoryToken(UserPreference));
    token = app.get(JwtService).sign({ sub: 'user-1', email: null });
  });

  beforeEach(() => {
    repo.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  function auth(req: request.Test): request.Test {
    return req.set('Authorization', `Bearer ${token}`);
  }

  describe('POST /preferences', () => {
    it('stores the survey and returns 201', async () => {
      const res = await auth(request(app.getHttpServer()).post('/preferences'))
        .send({ data: SURVEY })
        .expect(201);

      const body = res.body as StoredPreference;
      expect(body.data).toEqual(SURVEY);
      expect(body.userId).toBe('user-1');
    });

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer())
        .post('/preferences')
        .send({ data: SURVEY })
        .expect(401);
    });

    it('returns 400 when data is missing', async () => {
      await auth(request(app.getHttpServer()).post('/preferences'))
        .send({})
        .expect(400);
    });

    it('returns 400 on non-whitelisted fields', async () => {
      await auth(request(app.getHttpServer()).post('/preferences'))
        .send({ data: SURVEY, extra: 'nope' })
        .expect(400);
    });

    it('overwrites on repeat submit', async () => {
      await auth(request(app.getHttpServer()).post('/preferences'))
        .send({ data: SURVEY })
        .expect(201);

      const res = await auth(request(app.getHttpServer()).post('/preferences'))
        .send({ data: { genre: ['jazz'] } })
        .expect(201);

      expect((res.body as StoredPreference).data).toEqual({ genre: ['jazz'] });
    });
  });

  describe('GET /preferences', () => {
    it('returns the stored survey', async () => {
      await auth(request(app.getHttpServer()).post('/preferences'))
        .send({ data: SURVEY })
        .expect(201);

      const res = await auth(
        request(app.getHttpServer()).get('/preferences'),
      ).expect(200);

      expect((res.body as StoredPreference).data).toEqual(SURVEY);
    });

    it('returns 404 when not onboarded', async () => {
      await auth(request(app.getHttpServer()).get('/preferences')).expect(404);
    });

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer()).get('/preferences').expect(401);
    });
  });

  describe('PATCH /preferences', () => {
    it('merges into the stored survey', async () => {
      await auth(request(app.getHttpServer()).post('/preferences'))
        .send({ data: SURVEY })
        .expect(201);

      const res = await auth(request(app.getHttpServer()).patch('/preferences'))
        .send({ data: { genre: ['rock'] } })
        .expect(200);

      expect((res.body as StoredPreference).data).toEqual({
        ...SURVEY,
        genre: ['rock'],
      });
    });

    it('returns 404 when not onboarded', async () => {
      await auth(request(app.getHttpServer()).patch('/preferences'))
        .send({ data: { genre: ['rock'] } })
        .expect(404);
    });

    it('returns 400 on an empty body', async () => {
      await auth(request(app.getHttpServer()).patch('/preferences'))
        .send({})
        .expect(400);
    });
  });
});
