# Skill: Writing Pull Request Descriptions

## Overview
A guide for writing clear and consistent pull request titles and descriptions.

---

## PR Title

Use the same format as commit messages:

```
type: brief description in English, imperative mood
```

Examples:
```
add: Spotify OAuth login flow
fix: JWT token not refreshing on expiry
update: user entity add refreshToken column
```

---

## PR Body Template

```
## 개요
[변경 사항 한 줄 요약]

## 변경 내용
- [ ] 변경 항목 1
- [ ] 변경 항목 2

## 테스트
- [ ] 단위 테스트 추가/수정
- [ ] e2e 테스트 통과

## 관련 이슈
closes #이슈번호
```

---

## Writing Rules

- Focus on **intent**, not mechanics. Explain *why* the code changed, not *that* it changed.
- Bad: "AuthService에 메서드 추가함"
- Good: "액세스 토큰 만료 시 자동 갱신되지 않는 문제를 해결하기 위해 refreshToken 로직 추가"
- Keep the overview to one sentence.
- Checklist items should describe behavior, not file names.
- If there is no related issue, omit the `관련 이슈` section entirely.

---

## Assignees

Always assign the author(s) of the PR.

```bash
gh pr create --title "..." --body "..." --assignee @me
```

Multiple authors:
```bash
gh pr create --title "..." --body "..." --assignee @me --assignee username
```

---

## Merge Strategy

- Always merge via **squash merge**.
- The squash commit message should match the PR title format.
- Do not use regular merge commits or rebase merge for feature branches.

---

## Example

**Title:**
```
add: Spotify OAuth callback handler
```

**Body:**
```
## 개요
Spotify OAuth 인증 완료 후 사용자 정보를 저장하고 JWT를 발급하는 콜백 처리 추가

## 변경 내용
- [x] SpotifyStrategy 구현 (Passport OAuth2)
- [x] /auth/spotify/callback 엔드포인트 추가
- [x] 신규 유저 자동 생성 로직 추가

## 테스트
- [x] 단위 테스트 추가/수정
- [x] e2e 테스트 통과

## 관련 이슈
closes #42
```
