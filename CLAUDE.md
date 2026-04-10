# NoChu Backend - CLAUDE.md

## Project Overview

**MoodTune (NoChu v2)** — Emotion-based music recommendation service

Users take a selfie or express their emotions in text. The AI server analyzes the emotion and recommends 5 songs tailored to the user's personal preferences.

- v1 repo: https://github.com/team-hanseungil/NoChu-BE
- Feature spec: https://www.notion.so/33e9ac344dbb80d9bac8ddd77b3fb5f9

### Service Flow

```
Client App
    │
    ▼
NestJS (auth · user · preference management · AI server proxy)
    │
    ▼
AI Server — FastAPI (facial emotion classification · text emotion analysis · song recommendation)
```

### Features

| Feature | Description |
|---------|-------------|
| Sign up / Login | Email + password, JWT (access 15m / refresh 7d) |
| Onboarding | Collect genre · emotion-based direction · artist · language · BPM preferences |
| Facial emotion analysis | App camera → AI server CNN/ViT model → emotion label + confidence |
| Text emotion analysis | Free-form text → AI server LangChain LLM → emotion + intensity |
| Integrated recommendation | Face (40%) + text (60%) weighted fusion → 5 song recommendations |
| Recommendation history | Fetch own last 20 records |
| Preference profile | Updatable anytime via PATCH after onboarding |

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

---

## Architecture Notes

- NestJS acts as a proxy to the AI server. AI server URL is environment-variable-driven
- Preference data stored as JSONB to minimize migrations when adding new fields
- History is saved asynchronously — no impact on recommendation response time
- AI server timeout > 10s returns 503
- Facial confidence < 0.4 is treated as neutral
