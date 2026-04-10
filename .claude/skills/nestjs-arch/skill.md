# NestJS Architecture Guide

## When to Create a New Module vs. Adding to Existing

Create a new module when:
- The feature has its own domain entity (e.g., `User`, `Track`, `Playlist`)
- The feature has independent routing (e.g., `/users`, `/playlists`)
- The responsibility is clearly separated from existing modules

Add to existing module when:
- The logic is a sub-concern of an existing domain (e.g., user preferences inside `UsersModule`)
- No new entity or route prefix is needed

---

## Feature Module Structure

```
src/
  users/
    dto/
      create-user-req.dto.ts
      user-res.dto.ts
    users.controller.ts
    users.service.ts
    users.module.ts
    user.entity.ts
```

---

## Controller Responsibilities

- Define routes and HTTP methods
- Validate and parse incoming request data (via DTOs + class-validator)
- Delegate all logic to the service
- Return DTO objects

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResDto> {
    return this.usersService.findOne(id);
  }
}
```

---

## Service Responsibilities

- Contain all business logic
- Orchestrate calls to repository or other services
- Transform entities into DTOs before returning

```typescript
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOne(id: string): Promise<UserResDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return plainToInstance(UserResDto, user);
  }
}
```

---

## Repository Responsibilities

- Encapsulate all DB queries
- Use TypeORM `Repository<Entity>` internally
- No business logic, no DTO mapping

```typescript
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }
}
```

---

## What NOT To Do

- No business logic in controllers
- No direct TypeORM calls inside services — delegate to repository
- No DTO construction in repositories
- No entity leaking from controllers (always return DTO)

---

## Dependency Injection

Use constructor injection exclusively.

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}
}
```

Register custom repositories and services in the module's `providers` array.

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
```
