# DTO & Validation Conventions

## Rules

- All request bodies must use a DTO class
- Use `class-validator` + `class-transformer`
- Register `ValidationPipe` globally in `main.ts`

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Create request | `Create{Resource}ReqDto` | `CreatePlaylistReqDto` |
| Update request | `Update{Resource}ReqDto` | `UpdatePlaylistReqDto` |
| Response | `{Resource}ResDto` | `PlaylistResDto` |

## Global ValidationPipe (main.ts)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

## Request DTO Example

```typescript
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreatePlaylistReqDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
```

```typescript
import { PartialType } from '@nestjs/mapped-types';

export class UpdatePlaylistReqDto extends PartialType(CreatePlaylistReqDto) {}
```

## Response DTO Example

```typescript
import { Expose } from 'class-transformer';

export class PlaylistResDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  static from(playlist: Playlist): PlaylistResDto {
    return plainToInstance(PlaylistResDto, playlist, {
      excludeExtraneousValues: true,
    });
  }
}
```

## Controller Usage

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
async create(@Body() dto: CreatePlaylistReqDto): Promise<PlaylistResDto> {
  const playlist = await this.playlistsService.create(dto);
  return PlaylistResDto.from(playlist);
}
```
