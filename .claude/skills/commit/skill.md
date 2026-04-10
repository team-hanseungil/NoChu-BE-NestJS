# Skill: Commit Message Writing

## Overview
A guide for writing consistent and clear commit messages.

---

## Commit Types

| Type | When to Use |
|------|-------------|
| `add:` | New files, new features, new dependencies |
| `update:` | Modifying or improving existing code |
| `delete:` | Removing files, functions, or code |
| `fix:` | Bug fixes |
| `hotfix:` | Urgent production bug fixes |
| `init` | Initial project or module setup (no colon, standalone) |
| `test:` | Adding or modifying test code |
| `docs:` | Documentation changes (README, JSDoc, etc.) |

---

## Format

```
type: brief description in English, imperative mood
```

- Written in English
- Use imperative mood: "add", "fix", "update" (no past tense)
- Lowercase first letter
- No trailing period
- Recommended under 50 characters

---

## Good Examples

```
add: Spotify OAuth callback handler
fix: JWT token not refreshing on expiry
update: user entity add refreshToken column
delete: remove deprecated auth middleware
test: add unit test for token refresh logic
docs: update README with env setup guide
hotfix: prevent null pointer in payment service
init
```

---

## Bad Examples

```
add: added feature
```
Why bad: past tense used, unclear what was actually added

```
fix: fixed stuff
```
Why bad: past tense used, zero descriptive information

```
Update user service and fix some bugs and add tests
```
Why bad: no type prefix, multiple unrelated changes bundled into one commit (split them)

```
add: 유저 기능 추가
```
Why bad: non-English message (must be written in English)

---

## Step-by-Step Workflow

### Step 1: Review changed files
```bash
git status
git diff --staged
```

### Step 2: Stage changes
```bash
git add <file>      # per file
git add -p          # per hunk (recommended)
```

One commit = one logical change.

### Step 3: Write message and commit
```bash
git commit -m "add: Spotify OAuth callback handler"
```

---

## Notes

- If multiple types of changes are mixed, split into separate commits.
- `init` is used standalone without a colon.
- Clean up WIP commits with `rebase -i` before pushing.
