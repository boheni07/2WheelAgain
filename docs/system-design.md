# 시스템 설계 (System Design)

> `2WheelAgain` — V1 시스템 설계 요약
> 설계 파일: `docs/design/system-design.md`

---

## 1. 기술 스택

| 분야 | 기술 | 버전 |
|------|------|------|
| **프레임워크** | Next.js 15 (App Router) | `^15.0.0` |
| **언어** | TypeScript | `^5.4.0` |
| **스타일** | Tailwind CSS v4 | `^4.0.0` |
| **UI 컴포넌트** | Radix UI + Headless UI | 최신 |
| **백엔드** | Next.js API Routes | — |
| **ORM** | Prisma | `^5.0.0` |
| **database** | PostgreSQL | `^16` (로컬: Docker) |
| **인증** | NextAuth.js v5 | `^5.0.0-beta` |
| **빌드/테스트** | pnpm, Vitest | `^9.0.0` |

---

## 2. 디자인 토큰

### 2.1 컬러 팔레트 (Industrial Green)

```css
/* styles/tokens.css */
:root {
  /* Primary & Brand */
  --color-primary-50: 239 246 244;   /* #eff6f4 */
  --color-primary-300: 140 170 130;   /* #8caa82 */
  --color-primary-500: 45 110 100;   /* #2d6e64 */
  --color-primary-700: 45 110 100;   /* #2d6e64 */
  --color-primary-900: 45 60 52;     /* #2d3c34 */

  /* Neutrals (Slate/Gray) */
  --color-neutral-50: 248 250 252;   /* #f8fafc */
  --color-neutral-100: 241 245 249;  /* #f1f5f9 */
  --color-neutral-400: 148 163 184;  /* #94a3b8 */
  --color-neutral-800: 30 41 59;     /* #1e293b */

  /* Status Colors */
  --color-success-500: 22 163 74;    /* #16a34a */
  --color-warning-500: 202 138 4;    /* #ca8a04 */
  --color-danger-500: 220 38 38;     /* #dc2626 */
  --color-info-500: 3 105 161;       /* #0369a1 */

  /* Spacing */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
}
```

### 2.2 타이포그래피

| 스케일 | 폰트 크기 | 라인 높이 | 용도 |
|--------|---------|---------|------|
| `text-xs` | `0.75rem` (12px) | `1rem` | 캡션, 뱃지 텍스트 |
| `text-sm` | `0.875rem` (14px) | `1.25rem` | 보조 텍스트, 폼 레이블 |
| `text-base` | `1rem` (16px) | `1.5rem` | 본문 텍스트 |
| `text-lg` | `1.125rem` (18px) | `1.75rem` | 소제목 |
| `text-xl` | `1.25rem` (20px) | `1.75rem` | 카드 제목 |
| `text-2xl` | `1.5rem` (24px) | `2rem` | 섹션 제목 |
| `text-3xl` | `1.875rem` (30px) | `2.25rem` | 히어로 제목 |

### 2.3 디바이스 breaks (Tailwind 기준)

| 스케일 | minWidth | 용도 |
|--------|----------|------|
| `sm` | 640px | 모바일 (~640px) |
| `md` | 768px | 태블릿 (~768px) |
| `lg` | 1024px | 데스크탑 (~1024px) |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra-large |

---

## 3. 컴포넌트 팔레트

### 3.1 Core UI Components (Shadcn / Radix 기반)

| 컴포넌트 | 용도 | 구현 방식 |
|----------|------|-----------|
| `Button.tsx` | 공통 버튼 | variants로 size, variant 스타일링; `asChild` 필수 |
| `Input.tsx` | 폼 입력 | Label + Error Message 조합 |
| `Card.tsx` | 정보 표시 | Header + Body + Footer 구조 |
| `Badge.tsx` | 상태/타입 표시 | variant-based color (pending, responded, completed...) |
| `Dialog.tsx` | 모달/다이얼로그 | 백드롭 드롭, 키보드 네비게이션 |
| `Select.tsx` | 드롭다운 선택 | 키보드 네비게이션 가능 |
| `Skeleton.tsx` | 로딩 표시 | 애니메이션 pulse |
| `DataTable.tsx` | 테이블 + 정렬/페이징 | 관리자 대시보드 전용 |
| `Pagination.tsx` | 페이지네이션 | 페이지 숫자 + 전후 이동 |

### 3.2 도메인별 컴포넌트

**Bikes 영역:**
- `BikeCard.tsx` — 자전거 카드 (이미지, 가격, 상태 뱃지, 제목)
- `BikeFilter.tsx` — 필터 UI (상태, 가격대, 원산)
- `BikeImageGallery.tsx` — 이미지 갤러리
- `BookingTimeline.tsx` — 상태 타임라인

**Admin 영역:**
- `AdminSidebar.tsx` — 사이드 네비게이션
- `MetricCard.tsx` — 대시보드 지표 카드
- `StatusBadge.tsx` — 상태별 뱃지
- `ActivityFeed.tsx` — 최근 운영 로그 피드
- `ActionDropdown.tsx` — 행별 액션 드롭다운

---

## 4. 데이터 모델 (Prisma)

### 4.1 Entity Relationship

```
User (1) ──── (N) Booking (N) ──── (1) Bike
User (N) ──── (1) ActivityLog  ──── (Entity)
Bike (N) ──── (1) ActivityLog  ──── (Entity)
User (1) ──── (N) Article        ──── (Entity)
```

### 4.2 Entity 정의

| Entity | 주요 필드 | 설명 |
|--------|---------|------|
| `User` | `id, email, name, phone, imageUrl, provider, snsId, role` | `provider`=`NAVER`|`KAKAO`, `snsId`=각 SNS 고유계정ID, `role`=`USER`|`ADMIN` |
| `Bike` | `id, brand, model, condition, price, source, images` | purchase / donation / seized |
| `Booking` | `id, bikeId, userId, type, status, contactInfo` | inquiry / purchase / donate |
| `ActivityLog` | `id, actorId, action, entityType, entityId, metadata, createdAt` | 모든 운영 작업 기록 |
| `Article` | `id, title, slug, excerpt, content, coverImage, authorId, status, category, publishedAt, createdAt, updatedAt` | BikeRun 수리 스토리, 서비스 소개 콘텐츠 |

### 4.3 상태 정의

**Bike 상태:** `available`, `reserved`, `rented`, `in_shop`, `sold`

**Booking 상태 전이:**
```
pending → responded → scheduled → completed
   ↓          ↓           ↓
 cancelled  cancelled   cancelled
```

**Article 상태:** `DRAFT`, `PUBLISHED`

---

## 5. 인증/인가 아키텍처

### 5.1 NextAuth.js v5 구성

- **Provider:** Naver, KakaoTalk (SNS OAuth 전용)
- **Session:** JWT 기반 쿠키, `provider`/`snsId` 포함
- **Callback:** OAuth callback → `User.findOrCreate({ snsId, provider })` → JWT签发
- **LoginPage:** `/login` — SNS 로그인 버튼 (Credentials 폼 비제공)
- **Registration:** OAuth 인증 완료 시 자동 생성 (별도 회원가입 없음)

```
[Visitor] --SNS 로그인--> [NextAuth SNS Provider API] --Callback--> [OAuth Profile Fetch]
                                                                             |
                                                                             v
                                                               [User.findOrCreate(snsId, provider)]
                                                                             |
                                                                             v
                                                           [JWT: role, snsId, provider]
                                                                             |
                                                                             v
                                                    [RBAC Middleware / layout]
                                                       - /admin/* -> role === ADMIN
                                                       - /bookings/* -> snsId === user.snsId
```

### 5.2 인가 규칙

| 엔티티 | Public | Admin |
|--------|--------|-------|
| `/bikes` 목록 | ✅ 읽기 | ✅ 읽기 + 필터 |
| `/bikes/:id` 상세 | ✅ 읽기 | ✅ 읽기 + 수정 |
| `/admin/bikes/*` | ❌ 403 | ✅ 전액 |
| `Booking` 생성 | ✅ | ✅ |
| `Booking` 상태 변경 | ❌ | ✅ |

**핵심 규칙:**
- 모든 `/admin` 라우트는 `layout.tsx`에서 RBAC 미들웨어 필수
- `auth()` (Server Component) 또는 `useAuth()` 훅 (Client) 사용
- `redirect("/login?error=FORBIDDEN")` — 실패 시 로그인 페이지로 리다이렉트

---

## 6. 라우트 구조

### 6.1 Public Routes (Next.js App Router)

```
/                               — 홈 (Landing)
/about                          — 서비스 소개 (About)
/blogs                          — 수리 이야기 목록 (Blog)
/blogs/[slug]                   — 수리 이야기 상세
/bikes                          — 자전거 목록 (Server Component)
/bikes/[id]                     — 상세 페이지
/bikes/[id]/inquire             — 구매 문의 (Client)
/bikes/[id]/donate-apply        — 나눔 신청 (Client)
/bookings                       — 내 예약 목록
/bookings/[id]                  — 예약 상세
/login                          — 로그인
/register                       — 회원가입
```

### 6.2 Admin Routes

```
/admin                          — 대시보드 overview
/admin/articles                 — 수리 이야기 CMS (DataTable)
/admin/articles/new             — 신규 작성 (Client)
/admin/articles/[id]/edit       — 편집 폼 (Client)
/admin/bikes                    — 관리자 자전거 목록 (DataTable)
/admin/bikes/[id]               — 자전거 상세/수정
/admin/bikes/[id]/edit          — 편집 폼 (Client)
/admin/bikes/new                — 신규 등록 (Client)
/admin/bookings                 — 전체 예약 목록
/admin/bookings/[id]            — 예약 상세/상태 변경
/admin/analytics                — 통계 대시보드
```

### 6.3 Admin Layout 필수 체크

```tsx
// admin/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    revalidatePath("/");
    redirect("/login?error=FORBIDDEN");
  }
  return <AdminProviders>{children}</AdminProviders>;
}
```

---

## 7. 백엔드 API 구조

```
/api
├── auth/*                      — login / register (NextAuth handler)
├── bikes                       — GET (목록) / POST (관리자)
├── bikes/[id]                  — GET / PUT / DELETE
├── bookings                    — GET / POST (인증 필요)
├── bookings/[id]               — GET / PUT (상태 변경)
├── articles                    — GET (공개) / POST (관리자)
├── articles/[slug]             — GET (공개) / PATCH (관리자)
└── admin/*                     — 관리자 전용 엔드포인트
```

### 7.1 API 응답 포맷

```typescript
interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;    // VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND, etc.
  };
}
```

### 7.2 Middleware 체인

1. **Auth:** 세션/토큰 검증 (`auth()`)
2. **RBAC:** 역할 기반 접근 제어
3. **Validation:** Zod 스키마로 요청 바디 검증
4. **Handler:** 도메인 로직 실행
5. **Response:** 표준 응답 포맷터로 반환

### 7.3 서비스 레이어

| 서비스 | 책임 |
|--------|------|
| `BikeService` | Bike CRUD, 상태 전이 |
| `BookingService` | 예약 생성/상태 변경, 상태 머신 검증 |
| `AuthService` | 로그인/회원가입, JWT 토큰 관리 |
| `LogService` | ActivityLog 기록 |
| `ArticleService` | Article CRUD (관리자), 공개 게시글 조회, slug 라우팅 |
| `EmailService` | 이메일 알림 (선택) |

---

## 8. 서버/클라이언트 컴포넌트 분리 규칙

| 레이어 | Type | 설명 |
|--------|------|------|
| `app/page.tsx` | Server | 데이터 fetch, 메타 태그, 시드 데이터 |
| `app/admin/page.tsx` | Server | `auth()`, Prisma 쿼리, `generateMetadata` |
| `components/ui/*` | Client | UI 상태 관리 (hover, focus, onClick) |
| `components/bikes/*` | Server/Client | 카드(서버) vs 폼/갤러리(클라이언트) |
| `app/admin/bikes/new` | Client | 폼 검증 및 상태 관리 |
| `hooks/*` | Client | React 상태 훅 |

**Server Component:**
- `await auth()` 가능
- `generateMetadata()` 사용
- 데이터 직접 fetch 가능
- 클라이언트 상태/이벤트 없음

**Client Component:**
- `"use client"` 지시어 필수
- 상태 변경: `useState`, `useEffect`
- 이벤트: `onClick`, `onChange`
- 라우팅: `useRouter()`

---

## 9. 개발 환경

### 9.1 필수 도구

- `node ≥ 20`, `pnpm ≥ 9`
- `docker ≥ 24` (PostgreSQL 컨테이너용)
- `volta` 또는 `nvm` (Node 버전 관리)

### 9.2 실행 명령어

```bash
pnpm build:all       # 전체 빌드
pnpm dev:all         # 전체 development 서버
pnpm test:all        # 전체 테스트
```

---

## 10. 구조 참고

- **디iscipline 규칙:** `CODE/*/AGENTS.md` 파일별 개발 가이드
- **에이전트 구성:** `harness/opencode.jsonc`
- **에이전트 프로파일:** `harness/agents.md`
- **스킬 정의:** `harness/skills.md`
