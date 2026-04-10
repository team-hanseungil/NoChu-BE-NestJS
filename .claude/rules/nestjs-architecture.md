# NestJS Architecture Conventions

## Layer Structure

```
Controller → Service → Repository (TypeORM)
```

- Controller: HTTP request/response only, no business logic
- Service: owns all business logic
- Repository: TypeORM built-in Repository, DB access only

## Module Structure

Split by feature directory:

```
src/
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    user.entity.ts
    dto/
      create-user.req.dto.ts
      user.res.dto.ts
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
  common/
    exceptions/
    filters/
    guards/
```

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Module | `{feature}.module.ts` | `users.module.ts` |
| Controller | `{feature}.controller.ts` | `users.controller.ts` |
| Service | `{feature}.service.ts` | `users.service.ts` |
| Entity | `{resource}.entity.ts` | `user.entity.ts` |
| Request DTO | `{action}-{resource}.req.dto.ts` | `create-user.req.dto.ts` |
| Response DTO | `{resource}.res.dto.ts` | `user.res.dto.ts` |

## DI Pattern

Constructor injection only. Field injection is forbidden.

```typescript
// correct
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
}

// forbidden
@Injectable()
export class UsersService {
  @InjectRepository(User)
  private usersRepository: Repository<User>;
}
```

## UserModule Example

```typescript
// user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

// users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResDto> {
    return this.usersService.findOne(id);
  }
}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
```
