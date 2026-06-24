# 프론트엔드 AGENTS Discipline

## 1. Purpose

프론트엔드 모달의 컴포넌트 구조, 페이지 라우팅, 상태 관리, 스타일링 지침을 정의합니다.
Next.js App Router 기반 Server/Client 컴포넌트 분리 규칙이 핵심입니다.

## 2. Directory Structure

```
frontend/                          # Next.js app root (실제 코드는 프로젝트 루트의 src/)
├── app/                           # App Router 페이지 트ree
│   ├── layout.tsx                 # 루트 레이아웃 (공통 Header/Footer)
│   ├── page.tsx                   # / — 홈 (Landing)
│   ├── bikes/
│   │   ├── page.tsx               # /bikes — 자전거 목록 (Server Component)
│   │   └── [id]/
│   │       ├── page.tsx           # /bikes/:id — 상세
│   │       ├── inquire/
│   │       │   └── page.tsx       # /bikes/:id/inquire — 구매 문의 폼 (Client)
│   │       └── donate-apply/
│   │           └── page.tsx       # /bikes/:id/donate-apply — 나눔 신청 (Client)
│   ├── admin/
│   │   ├── layout.tsx             # 관리자 라우트 레이아웃 (Auth 체크)
│   │   └── bikes/
│   │       ├── page.tsx           # /admin/bikes — 관리 목록
│   │       └── new/
│   │           └── page.tsx       # /admin/bikes/new — 자전거 등록 (Client)
│   ├── bookings/
│   │   ├── page.tsx               # /bookings — 내 예약 목록
│   │   └── [id]/
│   │       └── page.tsx           # /bookings/:id — 예약 상세
│   ├── login/
│   │   └── page.tsx               # 로그인
│   └── register/
│       └── page.tsx               # 회원가입
├── components/
│   ├── ui/                        # Reusable UI (Radix 기반)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Dialog.tsx
│   │   ├── DataTable.tsx
│   │   ├── Pagination.tsx
│   │   └── Skeleton.tsx
│   ├── bikes/
│   │   ├── BikeCard.tsx           # 자전거 카드 컴포넌트
│   │   ├── BikeFilter.tsx         # 필터 UI
│   │   ├── BikeImageGallery.tsx   # 이미지 갤러리
│   │   └── BookingTimeline.tsx    # 상태 타임라인
│   ├── layout/
│   │   ├── Header.tsx             # 내비게이션 헤더
│   │   ├── Footer.tsx             # 푸터
│   │   └── MobileNav.tsx          # 모바일 내비
│   ├── admin/
│   │   ├── AdminSidebar.tsx       # 관리자 사이드바
│   │   ├── StatusBadge.tsx        # 상태 뱃지 (Booking 상태별 color)
│   │   └── ActivityFeed.tsx       # 활동 피드
│   └── common/
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── api.ts                     # API 호출 래퍼 (axios/fetch)
│   ├── validation.ts              # zod 스키마
│   └── utils.ts                   # 공용 유틸리티
├── hooks/
│   ├── useAuth.ts                 # 인증 상태 훅
│   ├── useBikes.ts                # 자전거 목록/상세 fetch
│   ├── useBookings.ts             # 예약 관련 훅
│   └── useDebounce.ts             # UI 유틸 훅
├── types/
│   ├── bike.ts                    # Bike 관련 타입
│   ├── booking.ts                 # Booking 관련 타입
│   ├── user.ts                    # User 관련 타입
│   └── index.ts                   # re-export
├── styles/
│   ├── globals.css                # 전역 스타일 (Tailwind import)
│   └── tokens.css                 # CSS 변수 (design tokens)
└── __tests__/                     # Vitest + Testing Library
    ├── components/
    ├── hooks/
    └── pages/
```

## 3. Code Style Rules

### 3.1 Server / Client 컴포넌트 분리

| 컴포넌트 유형 | 규칙 | 예시 |
|--------------|------|------|
| **Server Component** (기본) | 데이터 fetch, SEO 페이지, 라우트 핸들러 | `page.tsx` default, `BikeCard`, `BikeFilter` |
| **Client Component** | `useState/useEffect/use`, 이벤트 핸들러, 폼, Dialog | `inquire/page.tsx`, `admin/bikes/new/page.tsx` |

**Client 전환 규칙**:
```tsx
// 반드시 최상단에 "use client" 주석
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function BikeInquireForm({ bikeId }: { bikeId: string }) {
  const [name, setName] = useState("");
  // ...
}
```

### 3.2 컴포넌트 작성 규칙

1. **함수 컴포넌트만 사용** — class 컴포넌트 금지
2. **컴포넌트 파일당 하나의 컴포넌트** — 여러 컴포넌트 필요 시 별도 파일
3. **Props 타입 명시** — `Partial<T>`, `Pick<T>` 등 활용
4. **컴포지션 패턴** — 깊은 prop-drilling 대신 Context/Provider
5. **Shadcn/Radix 조합** — Radix UI primitive + Tailwind for styling

**컴포넌트 예시**:
```tsx
// components/bikes/BikeCard.tsx
import type { Bike } from "@/types";
import { Card } from "@/components/ui/Card";
import Image from "next/image";
import Link from "next/link";

interface BikeCardProps {
  bike: Bike;
}

export function BikeCard({ bike }: BikeCardProps) {
  return (
    <Card asChild>
      <Link href={`/bikes/${bike.id}`}>
        <Image
          src={bike.coverImage}
          alt={`${bike.brand} ${bike.model}`}
          width={400}
          height={250}
          className="rounded-t-lg object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold">{bike.brand} {bike.model}</h3>
          <p className="text-sm text-muted-foreground">{bike.condition}</p>
          <p className="text-primary font-bold mt-2">
            {bike.price === null ? "무료" : `₩${bike.price.toLocaleString()}`}
          </p>
        </div>
      </Link>
    </Card>
  );
}
```

### 3.3 데이터 Fetch 패턴

- **Server Component**: 직접 DB/Prisma에서 fetch or Server Actions
- **Client Component**: `SWR` 또는 `React Query` (TanStack Query)
- **fetch 래퍼 사용**: 공통 auth header, 에러 처리

```tsx
// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? "API request failed");
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};
```

### 3.4 Form 처리

- **React Hook Form + zod**로 유효성 검사
- Server Component: **Next.js Server Actions** 또는 API Router
- Client Component: React Hook Form + `onSubmit` → API 호출

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bikeInquireSchema, type BikeInquireForm } from "@/lib/validation";

export function BikeInquireForm({ bikeId }: { bikeId: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BikeInquireForm>({
    resolver: zodResolver(bikeInquireSchema),
  });

  const onSubmit = async (data: BikeInquireForm) => {
    await fetch(`/api/bikes/${bikeId}/inquire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  // ...
}
```

### 3.5 스타일링

- Tailwind CSS utility-first, 디자인 토큰은 `globals.css` CSS 변수에 정의
- "Industrial Green" 테마: `teal-700`(primary), `gray-800`(bg), `sage-500`(accent)
- **no inline styles**, **no CSS modules** — Tailwind만
- **no arbitrary Tailwind values** — `[#1a3c34]` → CSS 변수로 변경

```css
/* styles/globals.css */
@layer base {
  :root {
    --color-primary: 45 110 100;   /* teal-700 equivalent */
    --color-bg: 45 50 48;         /* gray-800 equivalent */
    --color-accent: 140 170 130;   /* sage-500 equivalent */
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
  }
}
```

## 4. Must Do

- ✅ Server Component를 기본으로 사용 — 데이터 fetch, SEO, 라우트 핸들러
- ✅ `next/image` 사용 — 외부 이미지 최적화
- ✅ `Link` 컴포넌트 사용 — 클라이언트 사이드 네비게이션
- ✅ Zod 스키마로 폼 유효성 검사 — 서버/클라이언트 양쪽에서
- ✅ 컴포넌트에 접근성 속성 부여 — `aria-label`, `role`, 키보드 포커스
- ✅ 페이지에 `generateMetadata` 또는 `Metadata` export — SEO
- ✅ `Suspense`로 로딩 UI 제공 — `loading.tsx` pattern
- ✅ 에러 경계 — `error.tsx` 파일 패턴 사용
- ✅ 상태 뱃지 color 코딩 — `pending`(yellow), `responded`(blue), `completed`(green), `cancelled`(red)

## 5. Must Not Do

- ❌ `as any` 또는 `as unknown as T`
- ❌ `dangerouslySetInnerHTML`
- ❌ CSS-in-JS (styled-components, emotion 등)
- ❌ `useEffect`로 데이터 fetch — Server Component 또는 `SWR`/`React Query` 사용
- ❌ localStorage에 토큰 저장 — httpOnly cookie 또는 session storage
- ❌ 페이지 컴포넌트에서 `useState/useEffect` (Client로 전환 고려)
- ❌ `getServerSideProps` — App Router이므로 사용 불가
- ❌ 글로벌 CSS 파일에 `<style>` 태그 삽입
- ❌ `console.log`를 프로덕션에서 남김 — `lib/logger`로 대체

## 6. Agent Commands

```bash
# Development
pnpm -F frontend dev              # 개발 서버 실행 (port: 3000)
pnpm -F frontend build            # 프로덕션 빌드
pnpm -F frontend start            # 빌드 결과 실행

# Lint / Format
pnpm -F frontend lint             # ESLint 실행
pnpm -F frontend lint:fix          # ESLint auto-fix

# Test
pnpm -F frontend test             # Vitest 실행
pnpm -F frontend test:watch        # watch mode
pnpm -F frontend test:coverage    # 커버리지 리포트

# Type Check
pnpm -F frontend typecheck         # tsc --noEmit
```

## 7. File Index (Key Files)

| 파일 | 용도 |
|------|------|
| `src/app/layout.tsx` | 루트 레이아웃 (Header, Footer, AuthProvider) |
| `src/app/page.tsx` | 홈 페이지 (Landing) |
| `src/app/bikes/page.tsx` | 자전거 목록 (Server) |
| `src/app/admin/layout.tsx` | 관리자 레이아웃 (RBAC 미들웨어) |
| `src/components/ui/Button.tsx` | Button (Radix + Tailwind) |
| `src/lib/api.ts` | API 호출 래퍼 |
| `src/lib/validation.ts` | Zod 스키마 집합 |
| `src/hooks/useAuth.ts` | 인증 상태 훅 |
| `src/styles/globals.css` | 전역 스타일 + 디자인 토큰 |
| `src/@types/index.ts` | 글로벌 타입 확장 |
