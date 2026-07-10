import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { PreferencesService } from '../preferences/preferences.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { UnauthorizedException } from '../common/exceptions/unauthorized.exception';

function jsonResponse(ok: boolean, body: unknown): Response {
  return { ok, json: () => Promise.resolve(body) } as unknown as Response;
}

const CONFIG: Record<string, string> = {
  JWT_REFRESH_SECRET: 'refresh-secret',
  SPOTIFY_CLIENT_ID: 'client-id',
  SPOTIFY_CLIENT_SECRET: 'client-secret',
  SPOTIFY_CALLBACK_URL: 'nochu://auth/spotify/callback',
};

describe('AuthService', () => {
  let service: AuthService;
  let jwt: { sign: jest.Mock; verify: jest.Mock };
  let usersService: {
    findBySpotifyId: jest.Mock;
    create: jest.Mock;
    updateSpotifyRefreshToken: jest.Mock;
  };
  let redisService: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let preferencesService: { existsByUserId: jest.Mock };
  let cryptoService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let configService: { get: jest.Mock };
  let fetchMock: jest.SpyInstance;

  const user = { id: 'user-1', email: 'a@b.com', spotifyId: 'sp-1' };

  function mockSpotifySuccess() {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(true, {
          access_token: 'sp-access',
          refresh_token: 'sp-refresh',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(true, {
          id: 'sp-1',
          display_name: 'Name',
          email: 'a@b.com',
          images: [{ url: 'http://img' }],
        }),
      );
  }

  beforeEach(async () => {
    jwt = { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() };
    usersService = {
      findBySpotifyId: jest.fn(),
      create: jest.fn(),
      updateSpotifyRefreshToken: jest.fn(),
    };
    redisService = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
    preferencesService = { existsByUserId: jest.fn() };
    cryptoService = {
      encrypt: jest.fn((v: string) => `enc(${v})`),
      decrypt: jest.fn(),
    };
    configService = { get: jest.fn((key: string) => CONFIG[key]) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: configService },
        { provide: UsersService, useValue: usersService },
        { provide: RedisService, useValue: redisService },
        { provide: PreferencesService, useValue: preferencesService },
        { provide: CryptoService, useValue: cryptoService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    fetchMock = jest.spyOn(global, 'fetch');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loginWithCode', () => {
    it('creates a new user and returns onboarded=false', async () => {
      mockSpotifySuccess();
      usersService.findBySpotifyId.mockResolvedValue(null);
      usersService.create.mockResolvedValue(user);
      preferencesService.existsByUserId.mockResolvedValue(false);

      const res = await service.loginWithCode('code');

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ spotifyId: 'sp-1', email: 'a@b.com' }),
      );
      expect(redisService.set).toHaveBeenCalledWith(
        'refresh:user-1',
        'hashed',
        expect.any(Number),
      );
      expect(cryptoService.encrypt).toHaveBeenCalledWith('sp-refresh');
      expect(usersService.updateSpotifyRefreshToken).toHaveBeenCalledWith(
        'user-1',
        'enc(sp-refresh)',
      );
      expect(res.accessToken).toBe('token');
      expect(res.onboarded).toBe(false);
    });

    it('reuses an existing user and returns onboarded=true', async () => {
      mockSpotifySuccess();
      usersService.findBySpotifyId.mockResolvedValue(user);
      preferencesService.existsByUserId.mockResolvedValue(true);

      const res = await service.loginWithCode('code');

      expect(usersService.create).not.toHaveBeenCalled();
      expect(res.onboarded).toBe(true);
    });

    it('throws when Spotify code exchange fails', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(false, {}));
      await expect(service.loginWithCode('bad')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when Spotify profile fetch fails', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(true, { access_token: 'x' }))
        .mockResolvedValueOnce(jsonResponse(false, {}));
      await expect(service.loginWithCode('code')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when Spotify config is missing', async () => {
      configService.get.mockReturnValue(undefined);
      await expect(service.loginWithCode('code')).rejects.toThrow();
    });
  });

  describe('refresh', () => {
    it('issues new tokens for a valid refresh token', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'a@b.com' });
      redisService.get.mockResolvedValue('hashed');
      preferencesService.existsByUserId.mockResolvedValue(false);

      const res = await service.refresh('valid-token');

      expect(res.accessToken).toBe('token');
      expect(res.onboarded).toBe(false);
    });

    it('throws when the token cannot be verified', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      await expect(service.refresh('x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when no token is stored', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', email: null });
      redisService.get.mockResolvedValue(null);
      await expect(service.refresh('x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when the stored hash does not match', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', email: null });
      redisService.get.mockResolvedValue('hashed');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(service.refresh('x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('deletes the stored refresh token', async () => {
      await service.logout('user-1');
      expect(redisService.del).toHaveBeenCalledWith('refresh:user-1');
    });
  });
});
