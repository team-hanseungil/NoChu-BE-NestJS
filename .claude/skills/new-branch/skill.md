# Skill: New Branch Setup

## Overview
Creates a properly named branch from the latest main. Run this before starting work or when the current branch doesn't match the work being done.

---

## Step-by-Step Workflow

### Step 1: Sync with main
```bash
git fetch origin main
git status
```

If there are uncommitted changes, stash them first:
```bash
git stash
```

### Step 2: Checkout main and pull
```bash
git checkout main
git pull origin main
```

### Step 3: Determine branch name

Choose a branch name based on the work to be done. Follow the convention:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/{description}` | `feat/spotify-oauth` |
| Bug fix | `fix/{description}` | `fix/jwt-refresh-error` |
| Update | `update/{description}` | `update/user-entity` |
| Delete | `delete/{description}` | `delete/deprecated-endpoint` |
| Test | `test/{description}` | `test/auth-service` |
| Docs | `docs/{description}` | `docs/api-readme` |

Ask the user: **"What should the branch be named?"** if unclear from context.

### Step 4: Create and switch to new branch
```bash
git checkout -b <branch-name>
```

### Step 5: Restore stashed changes (if any)
```bash
git stash pop
```

---

## When to Use

- Current branch is `main`
- Branch name clearly doesn't match the work (e.g., branch is `feat/login` but changes are CI/CD files)
- Starting a new task unrelated to the current branch
