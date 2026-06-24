# Swagger / API Docs Conventions

## Setup

- Package: `@nestjs/swagger`
- Docs UI: `GET /docs` (registered in `main.ts` via `SwaggerModule.setup('docs', ...)`)
- Auto DTO docs: register `@nestjs/swagger` under `compilerOptions.plugins` in `nest-cli.json`. The plugin infers `@ApiProperty` from the TS types, so do not add `@ApiProperty` by hand for plain fields.

## main.ts

```typescript
const config = new DocumentBuilder()
  .setTitle('nochu API')
  .setDescription('Emotion-based music recommendation service API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

## Controller Rules

- Every controller gets `@ApiTags('<feature>')` (kebab/lowercase, matching the resource name).
- Every route gets `@ApiOperation({ summary: '<concise action summary>' })`.
- JWT-protected routes (or controllers) get `@ApiBearerAuth()`. If the whole controller is guarded, declare it once at the class level.

```typescript
@ApiTags('preferences')
@ApiBearerAuth()
@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  @Post()
  @ApiOperation({ summary: 'Submit onboarding preferences' })
  upsert() {}
}
```

## DTO Rules

- The plugin infers the schema from types and `class-validator` decorators, so plain fields do not need `@ApiProperty`.
- Add `@ApiProperty({ example, description })` only when an example or description is genuinely needed.
- Return a ResDto type so the response schema is captured. Use `@ApiOkResponse({ type: XxxResDto })` when needed.

## Rules of Thumb

- `@ApiTags` + `@ApiOperation` are required whenever a new endpoint is added.
- The docs path (`/docs`) is reachable without authentication (manage production exposure at the infrastructure layer).
