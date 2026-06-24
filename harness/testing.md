# Harness Engineering — Testing

> `2WheelAgain` — Vitest + Playwright testing specifications
> Strictly design-only. No code generation.

---

## 1. Overview

Testing discipline for `2WheelAgain` follows a **Test Pyramid**:
- **Unit tests** (Vitest) — Zod schemas, utilities, auth helpers
- **Component tests** (Vitest + Testing Library) — UI components in isolation
- **E2E tests** (Playwright) — Full user flows, auth, RBAC

### 1.1 File Organization

```
frontend/src/__tests__/
├── unit/
│   ├── schemas.test.ts           # All Zod validation schemas
│   ├── prisma.test.ts            # Database query mocks
│   ├── auth.test.ts              # nextAuth helper functions
│   └── utils.test.ts             # Utility functions
├── components/
│   ├── card.test.tsx             # Card component
│   ├── button.test.tsx           # Button variants
│   ├── badge.test.tsx            # Status badges
│   └── article-card.test.tsx     # ArticleCard component
└── e2e/
    ├── homepage.test.ts          # Landing page
    ├── auth-signin.test.ts       # SNS OAuth login flow
    ├── bikes.test.ts             # Bike listing + detail
    ├── admin-redirect.test.ts    # RBAC enforcement
    ├── article.test.ts           # Article CRUD (admin)
    └── about.test.ts             # About page content
```

---

## 2. Vitest Unit Tests

### 2.1 Configuration

```ts
// vitest.config.ts (specification)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
});
```

### 2.2 Setup File

```ts
// __tests__/setup.ts (specification)
import { vi } from 'vitest';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
}));

vi.mock('next-auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
```

### 2.3 Schema Validation Tests

All Zod schemas MUST have unit tests covering:
- **Valid inputs** — `parse()` should succeed
- **Invalid inputs** — `parse()` should throw
- **Edge cases** — empty strings, max lengths, special characters
- **Partial updates** — optional fields for update schemas

```ts
// __tests__/unit/schemas.test.ts (specification)

describe('bikeCreateSchema', () => {
  // Valid bike creation
  // Invalid: missing brand
  // Invalid: negative price
  // Invalid: unknown condition enum
});

describe('bikeUpdateSchema', () => {
  // Valid: partial update (price only)
  // Valid: update status only
  // Invalid: null price (explicit null check)
});

describe('bookingSchema', () => {
  // Valid booking with all fields
  // Valid: minimal fields
  // Invalid: unknown type enum
  // Invalid: unknown status enum
});

describe('articleSchema', () => {
  // Valid: full article creation
  // Invalid: uppercase slug (must be kebab-case)
  // Invalid: empty title
  // Invalid: missing content
});
```

### 2.4 Prisma Mock Tests

```ts
// __tests__/unit/prisma.test.ts (specification)
// MUST mock @prisma/client — direct DB calls forbidden
// Must test:
//   - Bike findMany with filters
//   - Booking status transitions
//   - Article CRUD operations
//   - User upsert for OAuth
```

### 2.5 Component Tests

```ts
// __tests__/components/button.test.tsx (specification)
// MUST test:
//   - Primary button variant renders with correct class
//   - Secondary button with ring outline style
//   - Disabled state disables element
//   - Icon variants render without children text

// __tests__/components/article-card.test.tsx (specification)
// MUST test:
//   - Card renders cover image with alt text
//   - Category badge displays correct color
//   - Title and excerpt display within max lines
//   - Click navigates to /blogs/[slug]
```

### 2.6 Test Naming Convention

| Format | Purpose | Example |
|--------|---------|---------|
| `should...` | Positive assertion | `should validate a valid bike payload` |
| `rejects...` | Negative assertion | `rejects uppercase slug` |
| `renders...` | Visual assertion | `renders primary button with green fill` |
| `redirects...` | Navigation assertion | `redirects unauthenticated to /login` |

### 2.7 Test Constraints

- **No real DB calls** — all `@prisma/client` mocked
- **No HTTP calls** — all `fetch` mocked
- **No real OAuth** — NextAuth functions mocked
- **No sleep/setTimeout** — use `vi.useFakeTimers()` if needed
- **`vi.mock()` scope** — reset after each test to avoid leakage
- **`allowMultipleResults`** — enable for all tests

---

## 3. Playwright E2E Tests

### 3.1 Configuration

```ts
// playwright.config.ts (specification)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'src/__tests__/e2e',
  fullyParallel: true,
  retries: 2,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:8899',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  expect: {
    timeout: 5_000,
  },
  webServer: {
    command: 'pnpm -F frontend dev',
    port: 8899,
    reuseExisting: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'setup', ... },
    { name: 'chromium', use: { ... } },
  ],
});
```

### 3.2 Test Fixtures

Agents MUST create fixtures for common E2E patterns:

```ts
// __tests__/e2e/fixtures.ts (specification)

// authFixtures:
//   - beforeEach: navigate to /login
//   - signAsAdmin(page): login as seeded admin
//   - signAsUser(page): login as seeded user

// dbFixtures:
//   - beforeEach: clear and seed test data
//   - createBike(payload): seed a new bike
//   - createArticle(payload): seed a new article

// pageFixtures:
//   - beforeAll: goto http://localhost:8899
//   - clickPrimaryButton(selector): handle .btn-primary
//   - fillForm(fields): fill multiple inputs
//   - validateStatus(statusCode): assert response status
```

### 3.3 E2E Test Coverage Matrix

| Test | Page | Assertions |
|------|------|------------|
| `homepage.test.ts` | `/` | Hero renders, navigation links work, footer content |
| `auth-signin.test.ts` | `/login` | Naver + Kakao buttons visible, redirect on click |
| `bikes.test.ts` | `/bikes` | Bike cards render, filter buttons work, detail page loads |
| `bikes-detail.test.ts` | `/bikes/[id]` | Bike info renders, booking form validates, image gallery |
| `admin-redirect.test.ts` | `/admin/*` | Unauthenticated → `/login`, non-admin → `403` |
| `admin-bikes.test.ts` | `/admin/bikes` | Bike list in `<table>`, CRUD actions visible on admin |
| `article.test.ts` | `/blogs` | Article grid, category filter, pagination |
| `article.test.ts` | `/blogs/[slug]` | Full content displays, share button exists |
| `article-admin.test.ts` | `/admin/articles` | Article table, markdown editor, draft/publish toggle |
| `about.test.ts` | `/about` | Vision/mission grid, CTA buttons work |
| `contact.test.ts` | `/contact` | Contact form, validation, phone/email display |
| `admin-users.test.ts` | `/admin/users` | User table, role toggle, search |

### 3.4 RBAC E2E Tests (Critical)

```ts
// __tests__/e2e/rbac.test.ts (specification)

describe('RBAC Enforcement', () => {
  test('unauthenticated user cannot access /admin', async ({ page }) => {
    // Navigate to /admin without login
    // Should redirect to /login with next=/admin in URL
  });

  test('non-admin user cannot access /admin', async ({ page }) => {
    // Login as regular user
    // Navigate to /admin
    // Should show 403 or redirect
  });

  test('admin user can access /admin', async ({ page }) => {
    // Login as admin
    // Navigate to /admin
    // Should render admin dashboard
  });

  test('admin can POST /api/bikes', async ({ page }) => {
    // Admin authenticated
    // Create bike via API
    // Should return 201 with created bike
  });

  test('non-admin CANNOT POST /api/bikes', async ({ page }) => {
    // Non-admin authenticated
    // Attempt to create bike via API
    // Should return 403
  });
});
```

### 3.5 E2E Constraints

- **No hardcoded waits** — use `expect()` assertions for element visibility
- **No `sleep()`** — use Playwright's built-in auto-wait
- **`<table>` + `<thead>/<tbody>`** — admin tables MUST be testable with semantic selectors
- **Zod error rendering** — E2E tests MUST verify Zod validation error messages render in UI
- **403 response** — unauthed user on admin routes → `403` status code
- **Login page** — MUST only render Naver + Kakao buttons (no credential form)

---

## 4. Test Execution Commands

```bash
# All tests
pnpm test          # Vitest — unit + component
pnpm e2e           # Playwright — E2E

# Single test file
pnpm test -- schemas.test.ts          # Vitest
pnpm e2e -- auth-signin.test.ts       # Playwright

# Watch mode
pnpm test:watch                         # Vitest watch
pnpm e2e -- ui                          # Playwright interactive UI
```

---

## 5. Test Design Principles

1. **Independence** — each test is setup-complete; no test depends on another
2. **Deterministic** — no flaky tests; seed data is idempotent
3. **Fast** — unit tests < 1s; E2E tests < 30s each
4. **Readable** — test names read like specs: "should reject uppercase slug"
5. **Verifiable** — every assertion uses explicit expected state
6. **Agent-friendly** — structured patterns agents can replicate consistently

---

## 6. Constraint Checklist

| Rule | Enforcement |
|------|-------------|
| No `as any` in test code | Lint config |
| No real DB calls | `vi.mock('@prisma/client')` required |
| No real HTTP calls | `vi.mock('node-fetch')` or `fetch` mock |
| No real OAuth | NextAuth `vi.fn()` mocks |
| Strict mode TypeScript | `noEmit: true` in tsconfig test section |
| 2 retry on flaky | Playwright `retries: 2` |

> ⚠️ **Design-only**: This is specification. No test files are implemented. The `__tests__/` directory does not exist yet.
