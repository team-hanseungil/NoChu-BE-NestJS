# NoChu Backend - CLAUDE.md

## Project Overview

NestJS backend for the NoChu service.

---

## Tech Stack

- Framework: NestJS 11
- Language: TypeScript 5.7
- DB/ORM: TypeORM + PostgreSQL
- Auth: Spotify OAuth (fallback: Google OAuth) + JWT
- Test: Jest (unit + e2e)
- Code quality: ESLint 9 + Prettier

---

## Getting Started

```bash
npm run start:dev   # Run development server
npm run test        # Run unit tests
npm run test:e2e    # Run e2e tests
npm run lint        # Run linter
```

---

## Conventions

### Rules

Detailed rules are defined in the `.claude/rules/` directory.

### Branch Naming

| Type | Format |
|------|--------|
| Feature | `feat/issue-name` |
| Bug fix | `fix/~~` |
| Update | `update/~~` |
| Delete | `delete/~~` |
| Hotfix | `hotfix/~~` |
| Merge | `merge/~~` |
| Test | `test/~~` |
| Docs | `docs/~~` |

### Commit Messages

| Type | Format |
|------|--------|
| Feat | `feat: ~~` |
| Update | `update: ~~` |
| Delete | `delete: ~~` |
| Fix | `fix: ~~` |
| Hotfix | `hotfix: ~~` |
| Init | `init` |
| Test | `test: ~~` |
| Docs | `docs: ~~` |

### Code Style

- No comments. Code should be self-explanatory.
- If a comment is absolutely necessary, write it in Korean.
- Log messages must be in English, verb-first. e.g. `"Processing OAuth callback"`

---

## Directory Structure

```
.claude/
└── rules/    # Project-specific development rules
```
