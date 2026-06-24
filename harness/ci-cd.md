# Harness Engineering — CI/CD Pipeline

> `2WheelAgain` — Continuous Integration/Continuous Design specification
> Strictly design-only. No code generation.

---

## 1. Overview

CI pipeline for `2WheelAgain` is **GitHub Actions-first**. No Docker in repo; pipeline runs directly on ubuntu-latest runners.

### 1.1 Pipeline Stages

| Stage | Trigger | Description |
|-------|---------|-------------|
| **Lint** | PR / push to main | ESLint strict mode |
| **Typecheck** | PR / push to main | `tsc --noEmit` |
| **Unit Tests** | PR / push to main | Vitest — all schemas, utilities, components |
| **E2E Tests** | PR (main merge after review) | Playwright — 5 critical flows |
| **Build** | push to main | `next build` production verification |
| **Deploy** | main merge | Vercel auto-deploy (production) |

### 1.2 Branch Strategy

```
main
  └── feature/<description>   (all work)
      └── hotfix/<description>  (urgent main fixes)
```

- **main**: always buildable; protected branch
- **feature/**: open PR; all CI stages MUST pass to merge
- **hotfix/**: skip lint if urgent, but MUST pass test + build

---

## 2. GitHub Actions Workflow

### 2.1 CI Workflow

```yaml
# .github/workflows/ci.yml (specification)

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: twowheelagain_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm -F frontend prisma db push --skip-generate
      - run: pnpm -F frontend prisma generate

      - run: pnpm -F frontend lint
      - run: pnpm -F frontend typecheck
      - run: pnpm -F frontend test
      - run: pnpm -F frontend build

    env:
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/twowheelagain_test"
      NEXTAUTH_SECRET: "ci-test-secret-32-chars-minimum-here"
      NEXTAUTH_URL: "http://localhost:3000"
      NAVER_CLIENT_ID: "ci-mock"
      NAVER_CLIENT_SECRET: "ci-mock"
      KAKAO_CLIENT_ID: "ci-mock"
      KAKAO_CLIENT_SECRET: "ci-mock"
```

### 2.2 E2E Workflow (Separate, Manual Trigger)

```yaml
# .github/workflows/e2e.yml (specification)

name: E2E

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: twowheelagain_e2e
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm -F frontend prisma db push --skip-generate
      - run: pnpm -F frontend prisma generate
      - run: pnpm -F frontend prisma db seed

      - run: pnpm -F frontend e2e

    env:
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/twowheelagain_e2e"
      NEXTAUTH_SECRET: "e2e-test-secret-32-chars-minimum-here-"
      NEXTAUTH_URL: "http://localhost:3000"
```

### 2.3 CI Status Checks

For PR merge, **all** checks MUST pass:
- [ ] `Lint` ✓
- [ ] `Typecheck` ✓
- [ ] `Unit Tests` ✓
- [ ] `Build` ✓

E2E is optional for PRs but required for main branch push.

---

## 3. Build Configuration

### 3.1 Build Script

```json
// package.json (specification)
"scripts": {
  "build": "NODE_ENV=production next build"
}
```

### 3.2 Production Constraints

| Check | Rule |
|-------|------|
| TypeScript | zero `--noEmit` errors |
| Lint | zero warnings |
| Size | `next build` must complete within 60s |
| Assets | images under `public/` pre-bundled |
| Env | `process.env.NODE_ENV === 'production'` |

### 3.3 Build Error Handling

`next build` failing on error:
1. Agent reads `tsc` output for type errors
2. Fixes import/type/schema mismatches
3. Re-runs build
4. Must succeed before proceeding

> ⚠️ **Note**: Next.js 15 build is stricter than dev mode. All API routes MUST have valid TypeScript.

---

## 4. Deployment

### 4.1 Platform: Vercel

```yaml
# VERCEL_ENVIROMENTS (specification)

Staging:
  URL: https://twowheelagain-staging.vercel.app
  Trigger: PR preview deploy (auto)

Production:
  URL: https://twowheelagain.app
  Trigger: main branch merge
```

### 4.2 Vercel Environment Variables

Must match `.env.example` schema:

| Variable | Staging | Production |
|----------|---------|------------|
| `DATABASE_URL` | Staging DB | Production DB |
| `NEXTAUTH_SECRET` | ✅ | ✅ (different per env) |
| `NEXTAUTH_URL` | `STAGING_URL` | `PROD_URL` |
| `NAVER_CLIENT_ID` | ✅ | ✅ (different per env) |
| `NAVER_CLIENT_SECRET` | ✅ | ✅ |
| `KAKAO_CLIENT_ID` | ✅ | ✅ |
| `KAKAO_CLIENT_SECRET` | ✅ | ✅ |

### 4.3 Pre-Deployment Checklist

- [ ] All CI checks pass
- [ ] E2E tests ran successfully on staging
- [ ] Database migration reviewed
- [ ] OAuth callback URLs updated for production domain
- [ ] NEXTAUTH_SECRET generated for production

---

## 5. PR Review Automation

### 5.1 Automated Checks

| Check | Action |
|-------|--------|
| `CODE/*/AGENTS.md` violated | Comment on PR with violation details |
| Test coverage drops > 10% | Block merge |
| TypeScript errors introduced | Block merge |
| Missing `@prisma/client` mock in test | Comment warning |

### 5.2 Code Review Requirements

For agent-submitted PRs:
1. **Self-review** required — agent must comment changes
2. **Oracle review** recommended for auth/rbac changes
3. **E2E coverage** — all new pages need at least 1 E2E test
4. **DB migration** — any schema change MUST include migration

---

## 6. Monitoring & Observability

### 6.1 CI Metrics

- Build time: target < 60s
- Lint duration: target < 10s
- Unit test duration: target < 30s
- E2E test duration: target < 180s (5 tests × 30s max)

### 6.2 Failure Response Pattern

When CI fails:
1. Agent reads failed job log
2. Identifies root cause (lint, type, test)
3. Fixes without refactoring
4. Re-pushes to same branch
5. Reports fix in PR comment

> ⚠️ **Design-only**: No actual GitHub Actions files exist. CI/CD is specification awaiting implementation.
