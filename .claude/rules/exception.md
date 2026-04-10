# Exception Handling Conventions

## Directory Structure

```
src/
  common/
    exceptions/
      not-found.exception.ts
      unauthorized.exception.ts
    filters/
      http-exception.filter.ts
```

## Custom Exception Classes

Extend `HttpException` for all custom exceptions. Place in `src/common/exceptions/`.

```typescript
// src/common/exceptions/not-found.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND);
  }
}
```

```typescript
// src/common/exceptions/unauthorized.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class UnauthorizedException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
```

## Global Exception Filter

```typescript
// src/common/filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

## Register Filter Globally (main.ts)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}
```

## Error Response Format

```json
{
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/users/unknown-id"
}
```

## Usage in Service

```typescript
async findOne(id: string): Promise<User> {
  const user = await this.usersRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}
```

- Always throw from the service layer, not from the controller
- Pass human-readable English message strings to exception constructors
