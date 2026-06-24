# 백엔드 AGENTS Discipline

## 1. Purpose

백엔드 모달의 API 라우트 구조, 인증/인가, 데이터 검증, 에러 처리를 정의합니다.
Next.js API Routes를 사용하며, Prisma ORM으로 PostgreSQL과 통신합니다.

## 2. Directory Structure

```
backend/
├── index.ts                  # API 진입점 (라우터 정의)
├── routes/
│   ├── auth.ts               # POST /api/auth/login, /register
│   ├── bikes.ts              # GET/POST /api/bikes
│   ├── bikes-by-id.ts        # GET/PUT/DELETE /api/bikes/:id
│   ├── bookings.ts           # GET/POST /api/bookings
│   ├── bookings-by-id.ts     # GET/PUT /api/bookings/:id
│   └── admin.ts              # GET /api/admin/* (관리자 전용)
├── middleware/
│   ├── auth.ts               # JWT / session 인증 미들웨어
│   ├── rbac.ts               # 역할 기반 접근 제어
│   └── validation.ts         # 요청 바디 검증
├── services/
│   ├── bikeService.ts        # Bike 도메인 비즈니스 로직
│   ├── bookingService.ts     # Booking 상태 머신
│   ├── emailService.ts       # 이메일 알림 (선택)
│   └── logService.ts         # ActivityLog 기록
├── schemas/
│   ├── bike.schema.ts        # Bike 입력 검증 Zod 스키마
│   ├── booking.schema.ts     # Booking 입력 검증 Zod 스키마
│   └── auth.schema.ts        # 로그인/회원가입 검증
├── error/
│   ├── AppError.ts           # 커스텀 에러 클래스
│   └── errorHandler.ts       # 전역 에러 핸들러
├── utils/
│   ├── response.ts           # 표준 응답 포맷터
│   └── jwt.ts                # JWT 토큰 생성/검증
└── types/
    ├── api.ts                # API 공통 타입
    └── next.d.ts             # Next.js API 타입 확장
```

## 3. Code Style Rules

### 3.1 API Route 구조

각 API 엔드포인트는 `routes/` 하위에 별도 파일로 분리합니다.
각 파일은 method별 핸들러 함수를 export합니다.

```typescript
// routes/bikes.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getBikes, createBike } from "@/services/bikeService";
import { bikeCreateSchema } from "@/schemas/bike.schema";
import { parseAndValidate, respond, handle } from "@/utils/apiHelpers";

// GET /api/bikes
export const get = handle(async (req: NextApiRequest, res: NextApiResponse) => {
  const { page = "1", limit = "20", filter = "" } = req.query;
  const result = await getBikes({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    filter: filter as string,
  });
  return respond(res, 200, result);
});

// POST /api/bikes (admin only)
export const post = handle(async (req: NextApiRequest, res: NextApiResponse) => {
  const validated = await parseAndValidate(req, bikeCreateSchema);
  // auth middleware 체크는 라우팅 레벨에서 처리
  const bike = await createBike(validated);
  return respond(res, 201, bike);
});
```

### 3.2 표준 응답 포맷

모든 API 응답은 다음 구조를 따릅니다:

```typescript
interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;     // 예: "VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN"
    message: string;  // 사용자-facing 메시지
    details?: unknown; // 개발자용 디버깅 정보
  };
}
```

### 3.3 서비스 레이어 패턴

API 라우트는 가볍고, 비즈니스 로직은 `services/`로 분리합니다.

```typescript
// services/bookingService.ts
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/error/AppError";
import type { BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["responded", "-cancelled"],
  responded: ["scheduled", "-cancelled"],
  scheduled: ["completed", "-cancelled"],
  completed: [],
  cancelled: [],
};

export async function getBooking(bookingId: string, userId?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { bike: true, user: true, messages: true },
  });

  if (!booking) {
    throw new AppError("BOOKING_NOT_FOUND", "예약 정보를 찾을 수 없습니다.", 404);
  }

  // 일반 사용자는 본인 예약만 볼 수 있음
  if (userId && booking.userId !== userId) {
    throw new AppError("FORBIDDEN", "해당 예약을 조회할 권한이 없습니다.", 403);
  }

  return booking;
}

export async function transitionBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  actorId: string,
  actorRole: "admin" | "user"
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError("BOOKING_NOT_FOUND", "예약 정보를 찾을 수 없습니다.", 404);
  }

  const allowedTransitions = VALID_TRANSITIONS[booking.status];

  if (actorRole !== "admin" && !allowedTransitions.includes(newStatus)) {
    throw new AppError(
      "INVALID_TRANSITION",
      `현재 상태(${booking.status})에서 ${newStatus} 상태로 변경할 수 없습니다.`,
      422
    );
  }

  if (actorRole === "user" && booking.userId !== actorId) {
    throw new AppError("FORBIDDEN", "상태 변경 권한이 없습니다.", 403);
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
  });

  // 상태 변경 시 연결된 Bike의 contactInfo를 공개
  if (newStatus === "responded" || newStatus === "scheduled") {
    await prisma.bike.update({
      where: { id: booking.bikeId },
      data: { contactVisible: true },
    });
  }

  return updated;
}
```

### 3.4 인증/인가 미들웨어

```typescript
// middleware/auth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/jwt";
import { AppError } from "@/error/AppError";

export function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  role?: "admin" | "user"
) {
  const token = req.cookies?.token ?? req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new AppError("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  const payload = verifyToken(token);

  if (role === "admin" && payload.role !== "admin") {
    throw new AppError("FORBIDDEN", "관리자 권한이 필요합니다.", 403);
  }

  req.user = payload;
}
```

### 3.5 입력 검증

모든 API 엔드포인트는 Zod 스키마로 입력을 검증합니다.

```typescript
// schemas/booking.schema.ts
import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "pending",
  "responded",
  "scheduled",
  "completed",
  "cancelled",
]);

export const bookingCreateSchema = z.object({
  bikeId: z.string().uuid(),
  type: z.enum(["inquiry", "purchase", "donate"]),
  contact: z.string().min(5),
  message: z.string().max(500).optional(),
});

export const bookingStatusUpdateSchema = z.object({
  status: bookingStatusSchema,
  note: z.string().max(1000).optional(),
});
```

## 4. Must Do

- ✅ 모든 API 응답에 표준 포맷 (`success`, `data`, `error`) 사용
- ✅ API 라우트는 가볍고 서비스 레이어는 비즈니스 로직を担当
- ✅ 모든 입력은 Zod 스키마로 검증 (URL query, body, params 모두)
- ✅ 인증이 필요한 엔드포인트에는 `requireAuth()` 호출
- ✅ 에러는 `AppError`로 wrap 후 표준 에러 응답 반환
- ✅ 상태 전이는 `VALID_TRANSITIONS` 상수로 관리 + 검증
- ✅ `ActivityLog`에 모든 상태 변경 기록
- ✅ Pagination은 항상 `page` + `limit` 파라미터로 처리

## 5. Must Not Do

- ❌ `as any` 또는 `as unknown as T`
- ❌ 서비스 레이어에서 `res.send()` — 서버는 순수 비즈니스 로직만
- ❌ 직접 SQL 쿼리 — Prisma Query Builder만 사용
- ❌ 비밀번호를 plain text로 저장 또는 로그에 출력
- ❌ 상태 전이 검증 없이 바로 DB 업데이트
- ❌ 비동기 에러는 `catch {}`로 무시하지 말고 `handleError()`로 전파
- ❌ `console.error`로만 에러 로깅 — 구조화된 로거 사용
- ❌ API 키를 코드에 하드코딩 — 환경 변수만

## 6. Agent Commands

```bash
# Development
pnpm -F backend dev              # 백엔드 개발 서버

# Test
pnpm -F backend test             # Vitest 실행
pnpm -F backend test:watch        # watch mode

# Lint
pnpm -F backend lint              # ESLint
pnpm -F backend lint:fix          # auto-fix
```

## 7. File Index (Key Files)

| 파일 | 용도 |
|------|------|
| `routes/bikes.ts` | 자전거 목록/상세 API |
| `routes/bookings.ts` | 예약 CRUD API |
| `middleware/auth.ts` | JWT 인증 미들웨어 |
| `middleware/rbac.ts` | 역할 기반 접근 제어 |
| `services/bookingService.ts` | Booking 상태 머신 |
| `services/bikeService.ts` | Bike CRUD + 등록 |
| `schemas/bike.schema.ts` | Bike 입력 검증 스키마 |
| `schemas/booking.schema.ts` | Booking 입력 검증 스키마 |
| `error/AppError.ts` | 커스텀 에러 클래스 |
| `utils/response.ts` | 표준 응답 포맷터 |
| `utils/jwt.ts` | JWT 토큰 생성/검증 |
