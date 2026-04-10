# Skill: Systematic Debugging

## Overview
A structured debugging workflow that finds root causes instead of guessing.

---

## When to Use

- A bug is reported or discovered
- A test is failing
- Behavior does not match expectation
- An error appears in logs that is not immediately obvious

---

## Step-by-Step Process

### Step 1: 증상 기록 (Record the Symptom)
Capture exactly what is happening:
- Full error message
- Stack trace (top frame is usually most relevant)
- HTTP status code and response body (if API error)
- Which environment: local / staging / production?
- Is it reproducible every time or intermittent?

### Step 2: 재현 (Reproduce)
Create the smallest possible reproduction:
- Isolate the failing request or function call
- Strip out unrelated context
- Write a failing test if possible — this also serves as the fix verification

### Step 3: 가설 수립 (Form Hypotheses)
List 2–3 candidate causes ranked by likelihood:
```
1. [Most likely] JWT secret mismatch between issuer and verifier
2. [Possible] Token expiry set to 0 in test environment
3. [Less likely] Guard not applied to the route
```
Do not fix anything yet.

### Step 4: 검증 (Validate Each Hypothesis)
For each hypothesis, find evidence before changing code:
- Add temporary log statements
- Inspect values in a debugger or via unit test
- Read the relevant code path carefully
- Eliminate hypotheses one by one

### Step 5: 근본 원인 특정 (Identify Root Cause)
Find the deepest layer where the problem originates. Symptoms often appear far from the cause:
- A 500 error in the controller may originate in a misconfigured TypeORM entity
- A 401 may come from a missing provider in the module, not the guard logic itself

### Step 6: 수정 (Fix with Minimal Change)
Apply the smallest change that resolves the root cause:
- Do not refactor while fixing
- Do not fix unrelated issues discovered during investigation
- If the fix is non-obvious, add a comment explaining why

### Step 7: 검증 (Verify the Fix)
- Re-run the failing test — it must now pass
- Run the full test suite to check for regressions
- Manually verify the original symptom is gone

---

## NestJS-Specific Tips

### Dependency Injection Errors
```
Nest can't resolve dependencies of the XService
```
- Check for circular dependency: use `forwardRef()` if unavoidable
- Check that the provider is declared in the correct module's `providers` array
- Check that the module exporting the provider is imported in the consuming module

### TypeORM Errors
```
EntityMetadataNotFoundError: No metadata for "X" was found
```
- Confirm the entity is listed in `TypeOrmModule.forFeature([X])` in its module
- Confirm the entity is listed in the global `TypeOrmModule.forRoot` entities array or `autoLoadEntities: true` is set
- Check that pending migrations have been run

### JWT Errors
```
JsonWebTokenError: invalid signature
UnauthorizedException: Unauthorized
```
- Verify `JWT_SECRET` environment variable is set and identical on both sides
- Check token expiry (`exp` claim) — use jwt.io to decode and inspect
- Confirm the payload shape matches what the strategy expects
- Check that `JwtModule.register` uses the same secret as `JwtService`

---

## Rule

Never modify code based on a guess. Confirm the root cause with evidence before applying any fix. If the cause cannot be confirmed, escalate with the reproduction case and hypotheses.
