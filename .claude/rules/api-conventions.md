# API Conventions

## URL Path

- Use kebab-case for all paths
- Examples: `/users`, `/auth/spotify/callback`, `/playlist-items`

## HTTP Method Mapping

| Method | Purpose | Response Code |
|--------|---------|---------------|
| GET | Read | 200 |
| POST | Create | 201 |
| PUT | Full update | 200 |
| PATCH | Partial update | 200 |
| DELETE | Delete | 204 (no body) |

## Response Format

Success: return data directly (no wrapper object).

```typescript
// GET /users/:id → 200
{
  "id": "uuid",
  "email": "user@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z"
}

// POST /users → 201
{
  "id": "uuid",
  "email": "user@example.com"
}

// DELETE /users/:id → 204
(no body)
```

Failure: NestJS default HttpException format.

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (read / update) |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |

## Query Parameters

Use camelCase for query params.

```
GET /users?pageSize=10&pageNumber=1
GET /playlists?sortBy=createdAt&order=desc
```

## Controller Example

```typescript
@Controller('playlist-items')
export class PlaylistItemsController {
  constructor(private readonly playlistItemsService: PlaylistItemsService) {}

  @Get()
  findAll(@Query('pageSize') pageSize: number, @Query('pageNumber') pageNumber: number) {
    return this.playlistItemsService.findAll({ pageSize, pageNumber });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePlaylistItemReqDto) {
    return this.playlistItemsService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.playlistItemsService.remove(id);
  }
}
```
