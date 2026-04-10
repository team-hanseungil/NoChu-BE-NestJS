# Skill: Reviewing Pull Requests

## Overview
A checklist-based guide for reviewing NestJS pull requests systematically.

---

## How to Invoke

When asked to review a PR or a set of changed files, go through each checklist category below. For each item, check the actual code and flag any violations with the file path and line reference.

---

## Review Checklist

### 1. 기능 정확성 (Functional Correctness)
- [ ] Does the implementation satisfy the stated requirements?
- [ ] Are edge cases handled? (empty input, null, unauthorized access, etc.)
- [ ] Are error responses returning the correct HTTP status codes?
- [ ] Is async/await used correctly? (no unhandled promise rejections)

### 2. NestJS 컨벤션 (NestJS Conventions)
- [ ] Is layer responsibility correctly separated? (Controller → Service → Repository)
- [ ] Is business logic kept out of controllers?
- [ ] Are dependencies injected via constructor DI (no manual instantiation)?
- [ ] Are DTOs used for request/response shapes?
- [ ] Are decorators (`@Body()`, `@Param()`, `@Query()`) applied correctly?

### 3. TypeORM
- [ ] Are entities correctly defined with proper column types?
- [ ] Is the Repository pattern used (no raw SQL unless justified)?
- [ ] Are there N+1 query risks? (missing `relations` or `QueryBuilder` joins)
- [ ] Are transactions used where multiple writes occur?
- [ ] Are migrations created for schema changes?

### 4. 보안 (Security)
- [ ] Are authentication guards (`JwtAuthGuard`, etc.) applied to protected routes?
- [ ] Is authorization checked? (does the user own the resource?)
- [ ] Is all input validated via `class-validator` on DTOs?
- [ ] Are sensitive fields (password, token) excluded from responses?
- [ ] Are secrets read from environment variables, not hardcoded?

### 5. 테스트 (Testing)
- [ ] Are core business logic paths covered by unit tests?
- [ ] Are edge cases and failure scenarios tested?
- [ ] Are mocks/stubs used correctly (no real DB calls in unit tests)?
- [ ] Do existing tests still pass with this change?

### 6. 코드 품질 (Code Quality)
- [ ] Is there dead code or commented-out code?
- [ ] Is logic duplicated across files?
- [ ] Is any single file or function doing too much? (single responsibility)
- [ ] Are variable and function names clear and accurate?

---

## Output Format

Report only problems and improvement suggestions. Skip praise.

```
### 기능 정확성
❌ `src/auth/auth.controller.ts:34` - refreshToken 엔드포인트에 JwtAuthGuard 누락
   → `@UseGuards(JwtAuthGuard)` 데코레이터 추가 필요

### TypeORM
❌ `src/user/user.service.ts:61` - findAll()에서 N+1 위험
   → relations 옵션 대신 QueryBuilder + leftJoinAndSelect 사용 권장

### 테스트
❌ 테스트 없음 - refreshToken 로직에 대한 단위 테스트가 존재하지 않음
```

Use ✅ only when a category has zero issues (to confirm it was checked).
