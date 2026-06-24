# 테스트 (Testing) AGENTS Discipline

## 1. Purpose

Vitest 기반 유닛 테스트 + Playwright E2E 테스트 전략.

## 2. Directory Structure

```
frontend/src/
├── __tests__/
│   ├── unit/
│   │   ├── auth.test.ts    # nextAuth helper
│   │   └── schemas.test.ts # Zod 검증 스키마
│   ├── components/
│   │   ├── button.test.tsx
│   │   └── card.test.tsx
│   └── e2e/
│       ├── homepage.test.ts
│       └── admin-redirect.test.ts
├── vitest.config.ts
└── setup.ts
```

## 3. Code Style Rules

### 3.1 유닛 테스트 패턴 (Vitest)

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({
    bike: { findMany: vi.fn() },
    booking: { findMany: vi.fn(), update: vi.fn() },
  })),
}));

describe("Prisma Client", () => {
  it("should return bikes when querying available", async () => {
    const mockBikes = [{ id: "1", brand: "Trek" }];
    (prisma.bike.findMany as any).mockResolvedValue(mockBikes);
    const result = await prisma.bike.findMany({});
    expect(result).toEqual(mockBikes);
  });
});
```

### 3.2 E2E 테스트 패턴 (Playwright)

```ts
import { test, expect } from "@playwright/test";

test("admin redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.url()).toContain("/login");
});
```

### 3.3 Article 유닛 테스트

```ts
import { describe, it, expect } from "vitest";
import { articleCreateSchema, articleUpdateSchema } from "@/schemas/article.schema";

describe("articleCreateSchema", () => {
  it("should validate a valid article payload", () => {
    const valid = articleCreateSchema.parse({
      title: "잘못 멈춘 오토바이",
      slug: "stopped-motorcycle",
      excerpt: "도로변에 방치된 오토바이 수리 기록",
      content: "<p>수리 내용...</p>",
      status: "DRAFT",
      category: "repair",
    });
    expect(valid.title).toBe("잘못 멈춘 오토바이");
  });

  it("should reject invalid slug (uppercase letters)", () => {
    expect(() =>
      articleCreateSchema.parse({
        title: "Test",
        slug: "UPPERCASE-SLUG",
        content: "content",
      })
    ).toThrow();
  });

  it("should reject empty title", () => {
    expect(() =>
      articleCreateSchema.parse({
        title: "",
        slug: "ok",
        content: "content",
      })
    ).toThrow();
  });
});

describe("articleUpdateSchema", () => {
  it("should allow partial update (title only)", () => {
    const result = articleUpdateSchema.parse({ title: "Updated title" });
    expect(result.title).toBe("Updated title");
    // slug, content 등 나머지 필드는 optional → undefined
    expect(result.slug).toBeUndefined();
  });
});
```

### 3.4 Article E2E 테스트

```ts
import { test, expect } from "@playwright/test";

test("/blogs lists published articles", async ({ page }) => {
  await page.goto("/blogs");
  // 목록에 최소 1개 이상의 게시글 존재
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
});

test("/blogs/[slug] shows article content", async ({ page }) => {
  await page.goto("/blogs/stopped-motorcycle");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("수리 내용")).toBeVisible();
});

test("admin can create new article", async ({ page }) => {
  await page.goto("/login");
  // admin 로그인 수행
  await page.goto("/admin/articles/new");
  await page.fill("[name=title]", "새로운 수리 이야기");
  await page.fill("[name=slug]", "new-repair-story");
  await page.fill("[name=content]", "<p>수리 내용</p>");
  await page.selectOption("[name=category]", "repair");
  await page.click("[type=submit]");
  // 생성 후 목록 페이지로 리디렉션
  await expect(page.url()).toContain("/admin/articles");
});

test("about page shows service intro", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "2WheelAgain" })).toBeVisible();
  await expect(page.getByText("방치된 자전거")).toBeVisible();
});
```

## 4. Must Do

- 테스트는 `*.test.ts` / `*.test.tsx` — source와 인접 배치
- Vitest: `vi.fn()` / `vi.mock()`로 Prisma 모킹
- Playwright: 핵심 흐름만 (로그인, bike 조회, admin redirect)
- `beforeEach`에서 `vi.clearAllMocks()`

## 5. Must Not Do

- `as any` 타입 단언 — Prisma 타입 완전 사용
- Empty catch blocks
- E2E에 지엽적인 UI 테스트 포함 — 핵심 흐름만
- 테스트 간 상태 공유 — 각 테스트 독립적이어야 함
