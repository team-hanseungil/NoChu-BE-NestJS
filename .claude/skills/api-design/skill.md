# REST API Design Guide

## Route Naming Conventions

- Use kebab-case for multi-word segments: `/user-tracks`, `/playlist-items`
- Resource-first, action via HTTP method
- Plural nouns for collections: `/users`, `/playlists`
- Nested resources for ownership: `/users/:id/playlists`

---

## CRUD Route Patterns

| Method | Path              | Description   |
|--------|-------------------|---------------|
| GET    | /resources        | List all      |
| GET    | /resources/:id    | Get one by ID |
| POST   | /resources        | Create        |
| PATCH  | /resources/:id    | Partial update|
| DELETE | /resources/:id    | Delete        |

---

## Response Format

Return DTO directly — no wrapper object.

```typescript
@Get(':id')
findOne(@Param('id') id: string): Promise<UserResDto> {
  return this.usersService.findOne(id);
}
```

Do NOT wrap responses like `{ success: true, data: {...} }`.

---

## Pagination

Query params: `?page=1&limit=20`

Response shape:

```typescript
{
  data: T[],
  total: number,
  page: number,
  limit: number,
}
```

Example DTO:

```typescript
export class PaginatedResDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

---

## Common Decorators

```typescript
@Get()
@Post()
@Patch(':id')
@Delete(':id')

@Param('id') id: string
@Query('page') page: number
@Body() dto: CreateUserReqDto
```

---

## Auth Guards

Apply `JwtAuthGuard` to all protected routes.

```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@Request() req): Promise<UserResDto> {
  return this.usersService.findOne(req.user.id);
}
```

Apply at controller level to protect all routes in the controller:

```typescript
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {}
```
