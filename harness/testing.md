# Harness Engineering — 테스트 전략

> `2WheelAgain` — 테스트 전략 요약
> 본 문서는 설계 전용입니다. 코드 생성을 포함하지 않습니다.

---

## 1. 테스트 계층 피라미드 (Testing Pyramid)

```
         /\     (E2E)
        /  \
       /    \   (서비스 테스트)
      /______\
     /        \ (유닛 / 함수)  <-- 가장 많이 작성
    /__________\
┌─────────────────────────┐
│  Unit Tests (Vitest)    │
│  Function-based         │
│  Fast, isolated         │
└─────────────────────────┘
```

---

## 2. Vitest (단위 테스트)

### 2.1 구성 및 목적
- **테스트 프레임워크**: Vitest v2.0+
- **테스트 파일 패턴**: `src/**/*.test.ts`
- **목표**: 각 유틸함수, 유효성 검사 스키마, 서비스 로직의 단위 테스트

### 2.2 작성 규칙
1. **단위 테스트는 최대한 작고 빠르게 실행해야 함**:
   - 각 테스트는 단 하나의 함수 / 유틸리티 기능만 테스트
   - DB 연결 없이 테스트 → `vi.mock("@/lib/prisma")` 로 Prisma mocking
   - 테스트 당 3-5개의 assertion
2. **테스트 파일 구조**:
   ```ts
   // src/schemas/auth.test.ts
   import { describe, it, expect } from "vitest";
   import { loginSchema } from "./auth";

   describe("loginSchema", () => {
     it("should validate correct input", () => { ... });
     it("should reject missing email", () => { ... });
   });
   ```
3. **모의 객체 및 Fixtures**:
   - 테스트 데이터는 `fixtures.ts` 파일에서 관리
   - 모의 객체는 `vi.mock` 로만 생성하고, `vi.fn()` 사용하여 스텁 작성

### 2.3 코드 커버리지 목표
- **커버리지 목표**: 함수 라인 커버리지 **80%+**
- 테스트 실행: `pnpm -F frontend test:unit`

---

## 3. Playwright (E2E 테스트)

### 3.1 구성 및 목적
- **테스트 프레임워크**: Playwright v1.45+
- **테스트 파일 패턴**: `src/__tests__/**/*.test.ts`
- **목표**: 주요 사용자 흐름 테스트 (로그인, 목록 조회, 예약 등)

### 3.2 주요 테스트 시나리오 (V1)
1. **로그인 및 리다이렉션**:
   - Naver/Kakao 버튼 클릭 시 OAuth 페이지로 리다이렉션됨
   - 로그인 후 `/bikes` 리다이렉션
2. **자전거 목록 페이지**:
   - 페이지 로드 시 자전거 카드 표시
   - 필터 (가격, 상태) 적용
3. **관리자 대시보드 (ADMIN)**:
   - 로그인 후 `/admin/bikes` 진입
   - 자전거 등록 버튼 표시

### 3.3 코드 스타일
```ts
// src/__tests__/e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test("should redirect to naver oauth on login button click", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "네이버 로그인" }).click();
  await expect(page).toHaveURL(/.*naver.com.*\/authorize/);
});
```

---

## 4. 테스트 분리 및 격리

- **격리**: 각 테스트는 독립적으로 실행 가능해야 함
- **테스트 DB**: 별도의 테스트 DB 또는 `pg_try_create_db('test_twowheelagain')` 사용
- **고립 환경**:
  - `pnpm test:unit`은 In-memory Prisma Client 사용
  - `pnpm test:e2e`은 별도 테스트 용 PostgreSQL 사용
  - `pnpm test:lint`는 린트 규칙 체크만 수행

---

## 5. CI/CD 통합

- **GitHub Actions**:
  - PR 생성 시: `lint + typecheck + test:unit` 실행
  - `main` 브랜치 푸시 시: `build + test:e2e` 실행
- **로컬 테스트 실행**:
  ```bash
  # 전체 테스트 실행
  pnpm test:all
  # 단위 테스트만
  pnpm test:unit
  # E2E 테스트만
  pnpm test:e2e
  ```

---

## 6. 에이전트 테스트 제약사항

- 모든 기능 개발 시 해당 단위 테스트 필수 작성
- `vi.mock()` 을 사용하여 외부 의존성 격리
- 테스트명은 `describe + it` 패턴으로 작성
  - 예: `it("should return error when email is invalid")`
- 코드 커버리지가 80% 미만일 경우 PR 생성 금지
