# Skill: Writing Pull Request Descriptions

## Overview
A guide for writing clear and consistent pull request titles and descriptions.

---

## PR Title

Korean description only. No type prefix and no bracket prefix — do not prepend `feat:`, `fix:`, `[fix]`, etc.

```
Korean description
```

Examples:
```
Spotify OAuth 로그인 플로우 구현
JWT 토큰 만료 시 갱신 안 되는 문제 수정
user 엔티티 refreshToken 컬럼 추가
API 엔드포인트 문서 추가
```

---

## PR Body Template

Always use the repository PR template at `.github/PULL_REQUEST_TEMPLATE.md`. Do not invent your own sections — read that file and fill in each section in order.

Current template structure:

```
## #️⃣연관된 이슈
> ex) #이슈번호, #이슈번호

## 📝작업 내용
### 스크린샷 (선택)

## 💬리뷰 요구사항(선택)
> 리뷰어가 특별히 봐주었으면 하는 부분이 있다면 작성해주세요
```

- Keep the exact section headers from the file (including emoji).
- `#️⃣연관된 이슈`: link issues, or write `없음` if none.
- `📝작업 내용`: bullet the changes by intent. Omit the screenshot subsection if N/A.
- `💬리뷰 요구사항`: optional — fill only if there is something specific to flag.
- If the template file changes, follow the file, not this snippet.

---

## Writing Rules

- Focus on **intent**, not mechanics. Explain *why* the code changed, not *that* it changed.
- Bad: "AuthService에 메서드 추가함"
- Good: "액세스 토큰 만료 시 자동 갱신되지 않는 문제를 해결하기 위해 refreshToken 로직 추가"
- Keep the work summary concise; bullet by behavior, not file names.
- If there is no related issue, write `없음` under `#️⃣연관된 이슈`.

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
Spotify OAuth 콜백 핸들러 구현
```

**Body:**
```
## #️⃣연관된 이슈

closes #42

## 📝작업 내용

- authorization code exchange 로직 구현
- POST /auth/spotify 엔드포인트 추가
- 신규 유저 자동 생성 로직 추가

## 💬리뷰 요구사항(선택)

> 신규 유저 생성 시 email이 null일 수 있는데 처리 방식 봐주세요
```
