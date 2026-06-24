# Harness Engineering — Local Development Environment

> `2WheelAgain` — Agent-local environment specifications
> Strictly design-only. No code generation.

---

## 1. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >= 20.0.0 | LTS recommended |
| pnpm | >= 9.0.0 | Workspace package manager |
| PostgreSQL | >= 16.0 | Local instance |
| Docker (optional) | >= 24.0 | Recommended for DB |
| Git | >= 2.40.0 | Version control |

---

## 2. Directory Layout

```
2WheelAgain/
├── frontend/                 # Next.js 15 app
│   ├── .env                  # Local environment variables (Git-ignored)
│   ├── .env.example          # Template — committed to repo
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma schema
│   │   └── seed.ts           # Dev seed script
│   ├── src/
│   │   ├── app/              # App Router pages + API
│   │   ├── lib/              # Prisma client, auth config
│   │   ├── schemas/          # Zod validation schemas
│   │   └── __tests__/        # Vitest unit tests
│   ├── vitest.config.ts      # Vitest config
│   ├── playwright.config.ts  # Playwright E2E config
│   ├── tsconfig.json         # TypeScript config
│   ├── next.config.ts        # Next.js config
│   └── package.json          # Dependencies + scripts
├── CODE/                     # Discipline rules
│   ├── admin/AGENTS.md
│   ├── auth/AGENTS.md
│   ├── backend/AGENTS.md
│   ├── database/AGENTS.md
│   ├── design/AGENTS.md
│   ├── frontend/AGENTS.md
│   └── testing/AGENTS.md
├── docs/                     # Product design docs
│   ├── PRD.md
│   ├── system-design.md
│   └── user-flows.md
└── harness/                  # This directory
```

---

## 3. Environment Variables

### 3.1 `.env.example` Template

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/twowheelagain?schema=public"

# NextAuth v5
NEXTAUTH_URL="http://localhost:8899"
NEXTAUTH_SECRET="dev-secret-change-in-production-32chars-minimum"

# Naver OAuth
NAVER_CLIENT_ID=""
NAVER_CLIENT_SECRET=""
NAVER_CALLBACK_URL="http://localhost:8899/api/auth/callback/naver"

# KakaoTalk OAuth
KAKAO_CLIENT_ID=""
KAKAO_CLIENT_SECRET=""
KAKAO_CALLBACK_URL="http://localhost:8899/api/auth/callback/kakao"
```

### 3.2 Agent Constraints

- Agents MUST read `.env.example` as template — never hardcode secrets
- `.env.local` is Git-ignored; agents MUST create from `.env.example`
- Database URL uses `localhost:5432`; PostgreSQL instance must be running before `prisma db migrate`
- NEXTAUTH_SECRET must be >= 32 characters; agents SHOULD generate on first dev start

### 3.3 Validation Rules

| Variable | Required | Type | Validation |
|----------|----------|------|------------|
| `DATABASE_URL` | Yes | string | postgres:// prefix |
| `NEXTAUTH_URL` | Yes | string | http://localhost:8899 (dev) |
| `NEXTAUTH_SECRET` | Yes | string | >= 32 chars |
| `NAVER_CLIENT_ID` | Dev-only | string | Non-empty if OAuth testing |
| `NAVER_CLIENT_SECRET` | Dev-only | string | Non-empty if OAuth testing |
| `KAKAO_CLIENT_ID` | Dev-only | string | Non-empty if OAuth testing |
| `KAKAO_CLIENT_SECRET` | Dev-only | string | Non-empty if OAuth testing |

---

## 4. Database Setup

### 4.1 PostgreSQL Local Instance

```bash
# Docker (recommended)
docker run -d \
  --name twowheel-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=twowheelagain \
  -p 5432:5432 \
  postgres:16

# Verify
docker exec -it twowheel-db psql -U postgres -c "SELECT version();"
```

### 4.2 Prisma Lifecycle (Design Only)

```
Setup flow:
1. prisma init          → Generate schema.prisma + .env
2. prisma db push       → Sync schema to DB (dev)
3. prisma generate      → Generate Prisma Client
4. prisma db seed       → Seed initial data (design)
```

### 4.3 Seeding Strategy

Seed script (`prisma/seed.ts`) MUST create:

| Entity | Records | Purpose |
|--------|---------|---------|
| `User` (ADMIN) | 1 | Admin test account for `/admin/*` E2E |
| `User` (USER) | 2 | Citizen test accounts |
| `Bike` | 10 | Fixture for bike list/detail pages |
| `Article` | 5 | Blog listing fixture |
| `Booking` | 3 | Various status transitions |

**Seed constraints (design):**
- Admin user: `snsId="seed-admin"`, `provider="NAVER"`, `role="ADMIN"`, `email="admin@twowheel.kr"`
- User users: `role="USER"`, unique `snsId` per user
- Bikes: Mix of `AVAILABLE`, `SOLD`, `MAINTENANCE` statuses
- Articles: Mix of `DRAFT` and `PUBLISHED`
- Bookings: Cover all `BookingStatus` states for status transition testing
- Seed is idempotent — uses `upsert` by `snsId` to avoid duplicates on restart

### 4.4 Agent Seeding Commands

```bash
# Full reset + seed (for agent CI/test runs)
pnpm -F frontend prisma db push --force-reset
pnpm -F frontend prisma generate
pnpm -F frontend db:seed

# Standalone seed (production-safe)
pnpm -F frontend prisma db push
pnpm -F frontend db:seed
```

---

## 5. NextAuth v5 Local Configuration

### 5.1 Provider Setup

```
Providers:
  - Naver:   NAVER_CLIENT_ID + NAVER_CLIENT_SECRET
  - Kakao:   KAKAO_CLIENT_ID + KAKAO_CLIENT_SECRET

Session:
  - Strategy: JWT
  - Callback: /api/auth/callback/:provider

JWT Payload (design):
  - sub (User.id)
  - provider (SNSSProvider)
  - snsId (String)
  - role (UserRole)
  - name (String)
  - email (String?)
  - image (String?)
```

### 5.2 Authentication Flow (Design)

1. Client → `GET /login` → Renders Naver/Kakao buttons
2. Client → click → Redirect to OAuth provider
3. Provider → callback → `/api/auth/callback/naver|kakao`
4. `route.ts` → code exchange → profile fetch
5. `Prisma.upsert(user, { where: { snsId_provider } })`
6. JWT created with role claim
7. Redirect to original page or `/bikes`

### 5.3 Agent Auth Testing

Agents MUST test:
- `/admin/*` redirects unauthenticated users to `/login`
- Non-admin users get `403` on admin pages
- Admin users pass through `layout.tsx` auth check
- OAuth callback creates user if not exists (`upsert`)

---

## 6. Port & URL

| Service | URL | Port |
|---------|-----|------|
| Next.js dev server | `http://localhost:8899` | 8899 |
| PostgreSQL | `localhost:5432` | 5432 |
| Prisma Studio (optional) | `http://localhost:5555` | 5555 |

---

## 7. Development Scripts

```jsonc
// package.json scripts
dev:        "next dev -p 8899"      /* Start dev server */
build:      "next build"            /* Production build */
start:      "next start"            /* Production server */
lint:       "next lint"             /* ESLint check */
test:       "vitest run --passWithNoTests" /* Unit tests */
test:watch: "vitest"                /* Watch mode */
e2e:        "playwright test"       /* E2E tests */
typecheck:  "tsc --noEmit"          /* Type check */
db:migrate: "prisma db push"        /* Dev DB sync */
db:seed:    "tsx prisma/seed.ts"    /* Seed script */
db:studio:  "prisma studio"         /* DB viewer */
```

---

## 8. Agent Local Environment Checklist

Before agents begin implementation work:

- [ ] `.env.local` created from `.env.example`
- [ ] PostgreSQL 16 running on `localhost:5432`
- [ ] `pnpm install` completed
- [ ] `prisma db push` executed without errors
- [ ] `prisma generate` succeeds
- [ ] `pnpm -F frontend dev` starts on port 8899
- [ ] `pnpm -F frontend test` runs without failures
- [ ] `pnpm -F frontend typecheck` passes (zero errors)
- [ ] `/login` page renders (Naver + Kakao buttons visible)
- [ ] `/admin/*` routes redirect unauthenticated users

---

## 9. Constraints Summary

| Item | Rule |
|------|------|
| DATABASE_URL | Must be PostgreSQL; no SQLite for dev |
| Auth | SNS OAuth only (Naver/Kakao); no CredentialsProvider |
| Port | 8899 for dev server; document conflicts |
| Seeding | Idempotent; create admin test account |
| TypeScript | Strict mode; no `any` types |
| Prisma | `prisma db push` for dev; migrations for production |
| Git | `.env.local` in `.gitignore` |

> ⚠️ **Design-only**: Docker commands for PostgreSQL are specification. Do NOT run unless explicitly requested. The repository contains no Docker files.
