# NoChu Backend - CLAUDE.md

## Project Overview

**MoodTune (NoChu v2)** — 감정 기반 음악 추천 서비스

사용자가 셀카를 찍거나 텍스트로 감정을 표현하면, AI 서버가 감정을 분석하고 개인 취향에 맞는 노래 5곡을 추천한다.

- v1 레포: https://github.com/team-hanseungil/NoChu-BE
- 기능 명세서: https://www.notion.so/33e9ac344dbb80d9bac8ddd77b3fb5f9

### 서비스 흐름

```
클라이언트 앱
    │
    ▼
NestJS (인증 · 사용자 · 취향 관리 · AI 서버 프록시)
    │
    ▼
AI 서버 — FastAPI (표정 분류 · 텍스트 감정 분석 · 노래 추천)
```

### 주요 기능

| 기능 | 설명 |
|------|------|
| 회원가입 / 로그인 | 이메일 + 비밀번호, JWT (access 15분 / refresh 7일) |
| 온보딩 | 장르 · 감정별 추천 방향 · 아티스트 · 언어 · BPM 취향 수집 |
| 표정 감정 분석 | 앱 카메라 → AI 서버 CNN/ViT 모델 → 감정 레이블 + confidence |
| 텍스트 감정 분석 | 자유 텍스트 → AI 서버 LangChain LLM → 감정 + 강도 |
| 통합 추천 | 표정(40%) + 텍스트(60%) 가중치 융합 → 노래 5곡 추천 |
| 추천 히스토리 | 본인 데이터 최근 20건 조회 |
| 취향 프로필 | 온보딩 이후 언제든 PATCH로 수정 |

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

- NestJS는 AI 서버의 프록시 역할도 겸함. AI 서버 URL은 환경변수로 분리
- preference는 JSONB 저장으로 추후 항목 추가 시 마이그레이션 최소화
- 히스토리 저장은 비동기 처리 (추천 응답 지연 없음)
- AI 서버 타임아웃 10초 초과 시 503 반환
- confidence 0.4 미만 표정 감지는 neutral 처리
