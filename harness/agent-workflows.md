# Harness Engineering — Agent Workflows

> `2WheelAgain` — Multi-agent coordination, discipline, and verification
> Strictly design-only. No code generation.

---

## 1. Overview

Agent workflows for `2WheelAgain` enforce **structured orchestration**: no agent works in isolation. Every change flows through review, testing, and verification before merge.

### 1.1 Agent Roles

| Role | Responsibility | Scope |
|------|---------------|-------|
| **Builder** | Implements code following `CODE/*/AGENTS.md` | Single file or related files |
| **Oracle** | Architecture review for complex changes | Multi-module, auth, DB |
| **Metis** | Pre-planning analysis | Ambiguous/complex scope |
| **Momus** | Code review verification | Post-implementation |
| **Explorer** | Codebase discovery | Unfamiliar modules, patterns |
| **Librarian** | External reference research | Framework APIs, best practices |

### 1.2 Workflow States

```
REQUEST → PLANNING → CODING → REVIEW → TEST → MERGE
                      ↑        ↓
                      └── REJECT ←──────┘
```

---

## 2. Single-Agent Workflow (Simple Tasks)

For trivial changes (single file, known pattern):

```
1. Explorer: find existing pattern (if needed)
2. Builder: implement change
3. Builder: self-verify (lint + typecheck)
4. Done
```

### 2.1 Trivial Examples

| Task | Agent | Verification |
|------|-------|--------------|
| Fix typo in README | Builder | None |
| Add CSS class to existing component | Builder | `lsp_diagnostics` |
| Update Prisma enum value | Builder | TypeScript compiler |

### 2.2 Trivial Constraints

- **One file max** (or related sibling files like `page.tsx` + `layout.tsx`)
- **No new dependencies** or packages
- **No schema changes**
- **No auth/rbac modifications**

---

## 3. Multi-Agent Workflow (Complex Tasks)

For non-trivial changes (2+ modules, new feature, design decision):

```
1. Metis: analyze scope, identify ambiguity
2. Builder: create implementation plan
3. Momus: review plan for completeness
4. Explorer: discover existing patterns (parallel)
5. Librarian: research external APIs (parallel)
6. Builder: implement per plan
7. Oracle: architecture review
8. Momus: code correctness review
9. Builder: verify tests pass
10. Done — commit + PR
```

### 3.1 Discovery Phase

**Explorer** runs in parallel for pattern discovery:

| Query | Target |
|-------|--------|
| "Find auth middleware pattern" | `src/middleware.ts`, `src/app/*/layout.tsx` |
| "Find Zod schema patterns" | `src/schemas/` |
| "Find admin table rendering" | `src/app/admin/` + components |
| "Find NextAuth routes" | `src/app/api/auth/` |
| "Find RBAC enforcement" | Layout files with role checks |

**Librarian** runs in parallel for external references:

| Query | Target |
|-------|--------|
| "NextAuth v5 callback patterns" | GitHub examples (1k+ stars) |
| "Prisma upsert for OAuth" | Official docs |
| "Prisma upsert flow" | Official docs |
| "Zod validation best practices" | Zod docs |

Discovery runs in parallel — **Builder MUST NOT duplicate search** when Explorer/Librarian are active.

### 3.2 Planning Phase

Builder creates plan in `.sisyphus/plans/*.md`:

```
## Plan: [Feature Name]

### 1. Changes Required
| File | Action | Reason |
|------|--------|--------|
| `src/schemas/bike.schema.ts` | Add `status` field | Admin status transitions |
| `src/app/admin/bikes/page.tsx` | Add status dropdown | Admin CRUD UI |
| `src/app/api/admin/bikes/route.ts` | Add status update | Zod validated update |

### 2. Testing Plan
| Test Type | File | Coverage |
|-----------|------|----------|
| Unit | `bike.schema.ts` | `status` enum validation |
| Component | `admin-bike-status.tsx` | Dropdown render |
| E2E | `admin-bikes.test.ts` | Status update flow |

### 3. Verification Checklist
- [ ] Prisma schema matches type changes
- [ ] Zod schemas validate all status values
- [ ] Admin table renders status badge
- [ ] Tests pass (unit + typecheck)
- [ ] No `as any` or type suppression
```

### 3.3 Review Phase

**Oracle** reviews architecture decisions:
- Auth impact (any OAuth/rbac changes?)
- DB migration needed?
- Performance implications?

**Momus** reviews implementation:
- Follows `CODE/*/AGENTS.md`?
- Type safety maintained?
- Error handling complete?
- Tests cover all edge cases?

### 3.4 Verification Phase

Builder MUST run:

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Lint | `pnpm -F frontend lint` | Zero warnings |
| Typecheck | `pnpm -F frontend typecheck` | Zero errors |
| Unit tests | `pnpm -F frontend test` | All pass |
| E2E tests | `pnpm -F frontend e2e` | Critical flows pass |

> **No evidence = NOT COMPLETE.**

---

## 4. Agent Collaboration Rules

### 4.1 No Duplication

| Rule | Enforcement |
|------|-------------|
| Explorer/Librarian launched | Builder MUST NOT re-search same topics |
| Oracle already reviewed | Momus references Oracle findings |
| Plan approved | Builder follows plan, not improvises |

### 4.2 Knowledge Sharing

| Source | Propagation |
|--------|-------------|
| Oracle architecture decision | Included in PR description |
| Momus review finding | Fixed before committing |
| Explorer pattern discovery | Builder uses in implementation |
| Librarian best practice | Builder cites in code comments if non-standard |

### 4.3 Failure Recovery

When an agent fails:
1. **Builder fails** (build error, test fail) → Re-attempt once. If still failing, escalate to Oracle.
2. **Oracle rejects** → Builder revises plan. Momus re-reviews.
3. **Momus rejects** → Builder fixes specific violations. Re-test.
4. **All attempts exhausted** → Block merge. Request human review.

**Never delete or suppress failing tests to pass CI.**

---

## 5. Agent-Specific Workflows

### 5.1 Builder Workflow

```
START → read CODE/*/AGENTS.md → find pattern → implement → verify
    ↓                                    ↓
REJECT ←── check fails ←── lint/type/test
```

**Builder Constraints:**
- Must read `CODE/*/AGENTS.md` before any implementation
- Must NOT refactor while fixing a bug
- Must NOT suppress type errors with `as any`
- Must NOT delete failing tests
- Must verify after each file edit (lsp_diagnostics + typecheck)

### 5.2 Oracle Workflow

```
START → read affected files → check CODE/*/AGENTS.md → evaluate
    ↓                                    ↓
APPROVE ←── meets design ←── architecture review
    ↓
REJECT ←── violations found ←── specific feedback with file:line
```

**Oracle Evaluation Criteria:**
- Auth flow integrity (OAuth callback, session handling)
- RBAC enforcement correctness (middleware, layout checks)
- Database migration safety (index on unique constraints)
- Performance implications (N+1 query detection)
- Zod schema coverage (all edge cases addressed)

### 5.3 Momus Workflow

```
START → read changed files → check CODE/*/AGENTS.md → review
    ↓                                    ↓
APPROVE ←── all violations fixed ←── code review
    ↓
REJECT ←── violations found ←── specific file:line violations
```

**Momus Review Patterns:**

```
Violation: "Found `as any` in src/lib/auth.ts:42"
Violation: "Missing Zod validation in POST /api/bikes"
Violation: "Admin table uses <div> instead of <table>"
Violation: "CSS variable used directly in component (use token class)"
Violation: "Missing Zod validation in POST /api/bikes"
Violation: "Admin table uses <div> instead of <table>"
Violation: "CSS variable used directly in component (use token class)"
```

### 5.4 Explorer/Librarian Workflows

```
Explorer: START → search patterns → return file paths + descriptions → done
Librarian: START → research external API → return docs/examples/links → done
```

Both run **in background**. Builder continues non-overlapping work while waiting.

---

## 6. Commit Discipline

### 6.1 Commit Messages

Format: `[scope]: [action] [description]`

| Example | Scope | Action |
|---------|-------|--------|
| `[auth] migrate OAuth callback to Naver provider` | auth | migrate |
| `[admin] add status dropdown to bike table` | admin | add |
| `[db] add migration for article content change` | db | add |
| `[test] add Zod schema unit tests for booking` | test | add |
| `[docs] update PRD with V2 roadmap` | docs | update |

### 6.2 Commit Requirements

- All CI checks pass before commit
- No secrets in diff
- Migration files included with schema changes
- E2E coverage added for new pages

---

## 7. Workflow Matrix

| Task Complexity | Agents Involved | Verification |
|----------------|-----------------|--------------|
| **Trivial** | Builder | lint + typecheck |
| **Simple Feature** | Builder + Explorer | lint + typecheck + unit test |
| **Complex Feature** | Metis + Builder + Oracle + Momus | all checks + E2E |
| **Bugfix** | Builder | lint + typecheck + existing test |
| **Auth Change** | Explorer + Oracle + Builder + Momus | all + E2E |
| **DB Migration** | Explorer + Builder + Oracle | prisma + typecheck + schema matching |

---

## 8. Design-Only Constraint

This document is **specification only**. No workflow automation exists in the repository. Implementation order:

1. Implement CI pipeline (`.github/workflows/ci.yml`)
2. Implement E2E test fixtures
3. Implement seeding scripts
4. Implement lint configuration

> ⚠️ **Design-only**: No GitHub Actions, test fixtures, seeding scripts, or lint configs exist yet. All workflows are behavioral specification.
