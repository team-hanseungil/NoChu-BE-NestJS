# Commit & Branch Conventions

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/{description}` | `feat/spotify-oauth` |
| Bug fix | `fix/{description}` | `fix/jwt-refresh-error` |
| Update | `update/{description}` | `update/user-entity` |
| Delete | `delete/{description}` | `delete/deprecated-endpoint` |
| Hotfix | `hotfix/{description}` | `hotfix/auth-token-leak` |
| Merge | `merge/{description}` | `merge/feat-to-main` |
| Test | `test/{description}` | `test/auth-service` |
| Docs | `docs/{description}` | `docs/api-readme` |

## Commit Types

| Type | Usage |
|------|-------|
| `add` | Add new file, feature, or dependency |
| `update` | Modify existing logic or config |
| `delete` | Remove file, code, or dependency |
| `fix` | Fix a bug |
| `hotfix` | Critical production fix |
| `init` | Initial project setup |
| `test` | Add or update tests |
| `docs` | Documentation changes only |

## Commit Message Rules

- Language: English
- Start with imperative verb (add, update, fix, delete...)
- Format: `{type}: {imperative verb} {subject}`
- No period at end
- Keep subject under 72 characters

## Examples

```
init
add: Spotify OAuth callback handler
add: JWT access and refresh token issuance
update: user entity add refreshToken field
update: ValidationPipe global registration in main.ts
fix: JWT token refresh logic
fix: Spotify strategy missing scope config
delete: unused auth middleware
test: add unit tests for AuthService login method
docs: update API endpoint list
hotfix: prevent refresh token plain text storage
```
