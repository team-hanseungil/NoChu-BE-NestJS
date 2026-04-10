# Testing Guide

## Unit Test Structure

Place test files next to source files.

```
src/
  users/
    users.service.ts
    users.service.spec.ts
```

---

## e2e Test Location

```
test/
  users.e2e-spec.ts
  app.e2e-spec.ts
```

---

## Jest Config

Defined in `package.json` under the `jest` key.

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

---

## Mocking

Use `jest.fn()` for all dependencies. Mock repositories as plain objects.

```typescript
const mockUsersRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

---

## NestJS Test Module Setup

```typescript
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UsersService,
      {
        provide: UsersRepository,
        useValue: mockUsersRepository,
      },
    ],
  }).compile();

  service = module.get<UsersService>(UsersService);
});
```

---

## Supertest for e2e

```typescript
import * as request from 'supertest';

it('GET /users', () => {
  return request(app.getHttpServer())
    .get('/users')
    .expect(200);
});
```

---

## Test Naming Convention

```typescript
describe('UsersService', () => {
  describe('findOne', () => {
    it('should return user when found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findOne('some-id');
      expect(result).toEqual(expect.objectContaining({ id: 'some-id' }));
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## Coverage

```
npm run test:cov
```

---

## Commands

```
npm run test
npm run test:watch
npm run test:e2e
npm run test:cov
```
