# 테스트 AGENTS Discipline

## 1. Purpose

프로젝트의 테스트 전략, 환경 설정, 패턴을 정의합니다.
Vitest를 메인 테스트 러너로 사용하며, React Testing Library로 UI를 테스트합니다.

## 2. Directory Structure

```
testing/
├── AGENTS.md                    # 이 파일
├── vitest.config.ts             # Vitest 설정
├── setup.ts                     # 전역 테스트 설정 (Mock, polyfills)
│
├── unit/                        # 유닛 테스트
│   ├── lib/
│   │   ├── validation.test.ts   # Zod 스키마 검증
│   │   └── utils.test.ts        # 유틸리티 함수
│   └── services/
│       ├── bookingService.test.ts
│       └── bikeService.test.ts
│
├── components/                  # UI 컴포넌트 테스트
│   ├── Button.test.tsx
│   ├── BikeCard.test.tsx
│   └── BookingTimeline.test.tsx
│
├── hooks/                       # 커스텀 훅 테스트
│   ├── useAuth.test.ts
│   └── useBikes.test.ts
│
├── integration/                 # API 통합 테스트
│   ├── bikes.test.ts
│   ├── bookings.test.ts
│   └── auth.test.ts
│
└── e2e/                         # End-to-End 테스트
    ├── bikes.spec.ts
    ├── admin.spec.ts
    └── auth.spec.ts
```

## 3. Code Style Rules

### 3.1 테스트 파일 네이밍

- 테스트 파일은 `src/.../파일명.test.ts` 또는 `src/.../파일명.spec.ts` 규칙을 따릅니다.
- 컴포넌트는 `.test.tsx`, API/훅은 `.test.ts`를 사용합니다.

### 3.2 유닛 테스트 패턴 (Vitest)

```typescript
// services/bookingService.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { transitionBookingStatus, AppError } from "./bookingService";

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({
    booking: { findUnique: vi.fn(), update: vi.fn() },
  })),
}));

describe("transitionBookingStatus", () => {
  const prisma = new PrismaClient() as unknown as PrismaClient;
  const booking = { id: "1", status: "PENDING" as const, userId: "user1" };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.booking.update.mockResolvedValue({ ...booking, status: "RESPONDED" });
  });

  it("should transition from pending to responded for admin", async () => {
    const result = await transitionBookingStatus(
      "1",
      "RESPONDED",
      "admin1",
      "admin"
    );
    expect(result.status).toBe("RESPONDED");
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { status: "RESPONDED" },
    });
  });

  it("should throw INVALID_TRANSITION for user on 'completed'", async () => {
    await expect(
      transitionBookingStatus("1", "COMPLETED", "user1", "user")
    ).rejects.toThrow(AppError);
  });
});
```

### 3.3 UI 컴포넌트 테스트 패턴 (React Testing Library)

```tsx
// components/BikeCard.test.tsx
import { render, screen } from "@testing-library/react";
import { BikeCard } from "./BikeCard";

const mockBike = {
  id: "b1",
  brand: "Triple Seven",
  model: "Luna",
  price: 50000,
  condition: "GOOD",
  coverImage: "/bikes/luna.jpg",
};

describe("BikeCard", () => {
  it("should render bike brand and model", () => {
    render(<BikeCard bike={mockBike} />);
    expect(screen.getByText("Triple Seven Luna")).toBeInTheDocument();
  });

  it("should display price correctly", () => {
    render(<BikeCard bike={mockBike} />);
    expect(screen.getByText("₩50,000")).toBeInTheDocument();
  });
});
```

### 3.4 API 통합 테스트

API 통합 테스트는 `@testing-library/react`의 `http.mock` 또는 `supertest`를 사용합니다.

```typescript
// integration/bikes.test.ts
import { describe, it, expect } from "vitest";
import { http } from "@testing-library/react";

describe("GET /api/bikes", () => {
  it("should return a list of active bikes", async () => {
    const res = await fetch("/api/bikes");
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## 4. Must Do

- ✅ 각 비즈니스 로직에 유닛 테스트를 작성 — `bookingService`, `bikeService` 등
- ✅ 모든 폼 컴포넌트에 UI 테스트 — `submit`, `validation error`, `loading` 상태
- ✅ Zod 스키마를 `validation.test.ts`에서 positive/negative 케이스로 검증
- ✅ `beforeEach`에서 `vi.clearAllMocks()` 또는 `vi.resetAllMocks()` 필수 실행
- ✅ 테스트 이름은 `should_기대결과_조건` 포맷 — 예: `should_transition_to_responded_for_admin()`
- ✅ 테스트는 항상 독립적이어야 함 — DB/외부 API는 Mocking 필수 (단, E2E 예외)

## 5. Must Not Do

- ❌ `test.skip` 또는 `test.todo`를 프로덕션 코드에 남기지 마세요
- ❌ `any`를 테스트 데이터에 사용하지 마세요 — Mock 데이터 타입 명시
- ❌ `console.log`를 테스트 디버깅용으로 사용하지 마세요
- ❌ 비동기 테스트에서 `await`를 누락하지 마세요
- ❌ E2E 테스트에서 `cy.wait(nnn)` 같은 타임아웃 의존성 패턴 사용하지 마세요
- ❌ 테스트 실패 시 `try/catch`로 에러를 숨기지 마세요
- ❌ 테스트 커버리지 숫자에 현혹되지 마세요 — 핵심 로직 테스트에 집중

## 6. Agent Commands

```bash
# 전체 테스트
pnpm -F frontend test              # Vitest 실행
pnpm -F frontend test:watch         # watch mode
pnpm -F frontend test:coverage      # 커버리지 리포트 (target: 80%+)

# E2E 테스트 (Playwright)
pnpm -F frontend test:e2e           # E2E 실행
pnpm -F frontend test:e2e:ui        # Playwright UI 모드
pnpm -F frontend test:e2e:headed    # 브라우저를 열어 실행
```

## 7. File Index (Key Files)

| 파일 | 용도 |
|------|------|
| `vitest.config.ts` | Vitest 설정 (alias, globals, setupFiles) |
| `testing/unit/services/bookingService.test.ts` | Booking 상태 머신 논리 테스트 |
| `testing/components/BikeCard.test.tsx` | 자전거 카드 렌더링/접근성 테스트 |
| `testing/hooks/useAuth.test.ts` | 인증 상태 및 리페치 훅 테스트 |
| `testing/integration/bikes.test.ts` | API 라우트 엔드포인트 테스트 |
| `testing/e2e/bikes.spec.ts` | 실제 브라우저 시나리오 테스트 (Playwright) |
