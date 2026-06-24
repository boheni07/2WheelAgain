# 관리자 (Admin) AGENTS Discipline

## 1. Purpose

`/admin/*` 라우트가 적용되는 관리자 기능 구현 규칙.
RBAC auth layout, 대시보드 컴포넌트, CRUD 상태 변경 로직.

## 2. Directory Structure

```
frontend/src/app/admin/
├── layout.tsx             # auth() 체크 — admin(user.role !== "ADMIN") → redirect("/login")
├── page.tsx               # /admin — 대시보드 (지표 요약)
├── articles/
│   ├── page.tsx           # /admin/articles — 수리 이야기 목록 (DataTable)
│   ├── new/               # /admin/articles/new — 신규 작성 (Client Component)
│   │   └── page.tsx
│   └── [id]/
│       └── edit/          # /admin/articles/[id]/edit — 편집 폼 (Client Component)
│           └── page.tsx
├── bikes/
│   └── page.tsx           # /admin/bikes — 관리 데이터 테이블
├── bookings/
│   └── page.tsx           # /admin/bookings — 예약 관리
├── activities/
│   └── page.tsx           # /admin/activities — 활동 로그
└── components/            # admin 전용 컴포넌트
    ├── AdminBikeTable.tsx
    ├── AdminBookingTable.tsx
    ├── AdminArticleTable.tsx
    ├── StatusBadge.tsx
    └── ActivityFeed.tsx
```

### 2.1 Admin Article Table

```tsx
// admin/article/AdminArticleTable.tsx
interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  category: string;
  author: string;
  publishedAt?: string;
  updatedAt: string;
}

// <table> 기반 DataTable
// - 열: title, status(뱃지), category, author, publishedAt/updatedAt, actions(edit/delete)
// - 행: 각 Article 데이터
// - 액션 버튼: [Edit] → /admin/articles/[id]/edit, [Delete] → API 호출 후 confirm 모달
// - Key: 항상 `item.id`
```

### 2.2 Admin Article Form Flow (Client)

```
/admin/articles/new → AdminArticleFormClient (Client Component)
  - 폼 필드: 제목, slug(자동생성 or 수동입력), 본문(MDE), 카테고리, 썸네일 URL, 상태 드롭다운, 출판 날짜
  - 제출: POST /api/articles → 성공 시 redirect(/admin/articles) → 에러 시 폼 에러 표시
  - Zod 검증: articleCreateSchema 경유

/admin/articles/[id]/edit → AdminArticleFormClient (Client Component)
  - 초기값: API 또는 Server Component에서 pre-fetched article
  - 제출: PATCH /api/articles/[id] → 성공 시 redirect(/admin/articles)
  -slug 변경 시 old slug로 DELETE API 먼저 호출 후 new slug INSERT (API 라우트에서 처리)
```

## 3. Code Style Rules

### 3.1 RBAC auth

- `/admin/layout.tsx`에서 **단 한 번만** `auth()` 호출 — 개별 페이지에서 중복 금지
- 실제 구현: `layout.tsx`에서 `session.user.role !== "ADMIN"` → `redirect("/login")`

```tsx
// admin/layout.tsx (현존 구현)
const session = await auth();
const isAdmin = session?.user?.role === "ADMIN";
if (session && !isAdmin) return <div>접근 불가</div>;
if (!session) return <div>로그인 필요합니다</div>;
```

### 3.2 서버 컴포넌트 우선

- admin 페이지는 서버에서 Prisma 직접 쿼리 — 데이터 페칭 목적상 API 라우트 경유 불필요
- 상태 변경(`booking.status` 등)만 API 라우트 경유 — `PATCH /api/bookings/[id]/status`

### 3.3 컴포넌트 네이밍

- `AdminBikeTable`, `AdminBookingTable` — `Admin*` prefix (admin 도메인 명확성)
- 테이블: `<table>` 기반 + Tailwind 유틸리티, React Key는 항상 `item.id`

## 4. Must Do

- `/admin/layout.tsx`에서 유일한 RBAC auth 체크 — 중복 금지
- admin 테이블은 `<table>` 태그 + `<thead>/<tbody>` 사용 (<div> 레이아웃 금지)
- 데이터 페칭은 서버 컴포넌트에서 Prisma 직접
- 상태 변경 API는 `PATCH /api/bookings/[id]/status` 경유, Zod 검증 필수

## 5. Must Not Do

- admin 페이지에서 `auth()` 중복 호출
- Server Component에서 `useState` / `onClick` — Client Component로 분리
- `use client` 디렉티브 없이 Client 훅 사용 — TypeScript 오류 발생
