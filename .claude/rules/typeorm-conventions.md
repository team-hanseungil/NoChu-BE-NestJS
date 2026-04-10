# TypeORM Conventions

## Entity

- Decorator: `@Entity('table_name')` — always specify table name explicitly
- PK: `@PrimaryGeneratedColumn('uuid')`
- Timestamps: `@CreateDateColumn()`, `@UpdateDateColumn()`
- Column names: snake_case in DB, camelCase in entity

```typescript
@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Repository

Use TypeORM built-in Repository via `@InjectRepository(Entity)`. Do not create custom repository classes unless complex query logic requires it.

```typescript
@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistsRepository: Repository<Playlist>,
  ) {}

  findAll(): Promise<Playlist[]> {
    return this.playlistsRepository.find();
  }

  findOne(id: string): Promise<Playlist> {
    return this.playlistsRepository.findOne({ where: { id } });
  }

  create(data: Partial<Playlist>): Promise<Playlist> {
    const playlist = this.playlistsRepository.create(data);
    return this.playlistsRepository.save(playlist);
  }

  async remove(id: string): Promise<void> {
    await this.playlistsRepository.delete(id);
  }
}
```

## Migration

- Generate: `npm run migration:generate -- -n MigrationName`
- Run: `npm run migration:run`
- Revert: `npm run migration:revert`
- Never edit generated migration files manually
- Never use `synchronize: true` in production

## Relations

Always specify `cascade` option explicitly when using `@OneToMany` / `@ManyToOne`.

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Playlist, (playlist) => playlist.user, { cascade: true })
  playlists: Playlist[];
}

@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.playlists, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}
```

## Module Registration

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Playlist])],
  providers: [PlaylistsService],
  controllers: [PlaylistsController],
})
export class PlaylistsModule {}
```
