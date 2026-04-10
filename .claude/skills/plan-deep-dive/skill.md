# Skill: Deep-Dive Planning Before Implementation

## Overview
A structured analysis process to run before implementing complex features. Prevents wasted effort caused by misunderstood requirements or missed dependencies.

---

## When to Use

- Before implementing a feature that touches multiple modules
- When the requirement is ambiguous or underspecified
- When a change involves schema modifications, new auth flows, or external API integration
- Any time you feel the urge to "just start coding"

---

## Step-by-Step Process

### Step 1: 요구사항 파악 (Clarify Requirements)
Answer exactly: what needs to be built?
- What are the inputs and outputs?
- What are the acceptance criteria?
- What is explicitly out of scope?

### Step 2: 영향 범위 분석 (Impact Analysis)
List every file and module that will change:
- Which controllers, services, repositories are affected?
- Are new entities or columns needed?
- Does this require a new module or changes to `AppModule`?
- Are there shared utilities or interceptors that need updates?

### Step 3: 데이터 흐름 추적 (Trace Data Flow)
Follow the request lifecycle end to end:
```
HTTP Request → Controller → Guard → Service → Repository → DB
                                  ↓
                            External API (if any)
```
Identify exactly where the new logic sits in this chain.

### Step 4: 엣지 케이스 목록 (Edge Cases)
List failure scenarios and boundary conditions:
- What happens if the resource does not exist?
- What if the user is not authorized?
- What if an external service is down?
- What are the boundary values for numeric/date inputs?

### Step 5: 구현 순서 결정 (Implementation Order)
Order tasks bottom-up by dependency:
1. DB schema / entity changes first
2. Repository layer
3. Service layer
4. Controller and DTO
5. Guards / interceptors
6. Tests

### Step 6: 체크리스트 작성 (Task Breakdown)
Break down into atomic tasks using TodoWrite. Each task should be completable independently and verifiable.

---

## Output Format

Before starting implementation, produce a summary of 5–10 bullet points:

```
## Plan: [Feature Name]

- Scope: [modules/files affected]
- New entities or columns: [yes/no, list them]
- External dependencies: [yes/no, list them]
- Auth required: [yes/no, which guard]
- Edge cases: [list top 3]
- Implementation order: [ordered list]
- Estimated task count: [N tasks]
```

---

## Rule

Always confirm the plan with the user before writing any code. If the plan reveals an ambiguity or a conflict with existing design, surface it immediately rather than making an assumption.
