# TypeORM Usage Guide

## Entity Definition

```typescript
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## Repository Injection

```typescript
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
}
```

---

## Common Query Patterns

```typescript
this.userRepository.findOne({ where: { id } });

this.userRepository.find({ where: { email } });

this.userRepository.save(entity);

this.userRepository.update({ id }, { email: newEmail });

this.userRepository.delete({ id });
```

---

## QueryBuilder for Complex Queries

```typescript
this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.playlists', 'playlist')
  .where('user.id = :id', { id })
  .getOne();
```

---

## Migration Commands

Generate:
```
npm run migration:generate -- src/database/migrations/MigrationName
```

Run:
```
npm run migration:run
```

Revert:
```
npm run migration:revert
```

---

## Relation Patterns

OneToMany / ManyToOne:

```typescript
@Entity('users')
export class UserEntity {
  @OneToMany(() => PlaylistEntity, (playlist) => playlist.user)
  playlists: PlaylistEntity[];
}

@Entity('playlists')
export class PlaylistEntity {
  @ManyToOne(() => UserEntity, (user) => user.playlists)
  user: UserEntity;
}
```
