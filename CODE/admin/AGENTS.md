# 관리자 (Admin) AGENTS Discipline

## 1. Purpose

`2WheelAgain` 플랫폼의 관리자 대시보드 기능, 권한 체계, 전용 컴포넌트 및 데이터 흐름을 정의합니다.
관리자 기능은 `/admin/*` 라우트 아래의 서버 사이드 인증 체크를 필수로 합니다.

## 2. Directory Structure

```
frontend/app/admin/
├── layout.tsx               # 관리자 라우트 레이아웃 (RBAC 필수 체크)
├── page.tsx                 # /admin — 대시보드 overview (지표 요약)
└── bikes/
    ├── page.tsx             # /admin/bikes — 전체 자전거 목록 (데이터 테이블)
    ├── [id]/
    │   ├── page.tsx         # /admin/bikes/:id — 자전거 상세/수정
    │   └── edit/
    │       └── page.tsx     # /admin/bikes/:id/edit — 편집 폼
    └── new/
        └── page.tsx         # /admin/bikes/new — 신규 등록 폼
├── bookings/
│   ├── page.tsx             # /admin/bookings — 전체 예약 목록
│   └── [id]/
│       └── page.tsx         # /admin/bookings/:id — 예약 상세/상태 변경
└── analytics/
    └── page.tsx             # /admin/analytics — 이용 통계 대시보드
```

## 3. Code Style Rules

### 3.1 관리자 레이아웃

모든 `/admin` 아래 라우트는 `layout.tsx`에서 **RBAC 미들웨어를 거치도록** 강제합니다.

```tsx
// admin/layout.tsx
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. 세션/토큰 검증
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    revalidatePath("/");
    redirect("/login?error=FORBIDDEN");
  }
  return <AdminProviders>{children}</AdminProviders>;
}
```

### 3.2 데이터 테이블 패턴

```tsx
// admin/bikes/page.tsx — DataTable + Pagination 조합
async function getAdminBikes({ page, limit, filter }: QueryParams) {
  "use server";
  // 1. Prisma로 페이지네이션된 데이터 조회
  // 2. 총 개수로 totalPages 계산
  // 3. { success: true, data: Bike[], meta: { total, page, limit, totalPages } } 반환
}
```

### 3.3 상태 변경 흐름

```tsx
// admin/bookings/[id]/page.tsx — 상태 전이 폼
async function transitionBookingStatus(formData: FormData) {
  "use server";
  // 1. zod 검증
  // 2. serviceLayer.transitionBookingStatus(bookingId, newStatus, actorId, "admin")
  // 3. ActivityLog 자동 기록 (serviceLayer.log)
  // 4. 리다이렉트
}
```

## 4. Admin 전용 컴포넌트

```
frontend/components/admin/
├── AdminSidebar.tsx          # 사이드 네비게이션
├── MetricCard.tsx            # 대시보드 지표 카드 (총 자전거 수, 활성 예약 등)
├── StatusBadge.tsx           # 상태별 뱃지 (pending, responded, completed...)
├── DataTable.tsx             # 정렬/필터/페이징 내장 테이블
├── ActionDropdown.tsx        # 행별 액션 드롭다운 (edit, delete, change-status)
├── ActivityFeed.tsx          # 최근 운영 로그 피드
├── BikeRegistrationForm.tsx  # 관리자용 자전거 등록 폼
└── BookingStatusForm.tsx     # 예약 상태 변경 폼
```

## 5. Must Do

- ✅ `/admin` 라우트는 반드시 레이아웃에서 RBAC 체크 — 개별 페이지에서 중복 체크 불필요
- ✅ 대시보드 데이터는 `generateMetadata` 및 직접 데이터 fetch 로 서버 사이드에서 로드
- ✅ 상태 변경 시 `ActivityLog` 자동 기록 — 서비스 레이어에서 수행
- ✅ DataTable 컴포넌트는 URL state(`?page=&filter=`)와 연동하여 프라우저 북마크 가능하도록
- ✅ 관리자 전용 페이지는 `export const dynamic = "force-dynamic"`으로 캐시 방지

## 6. Must Not Do

- ❌ 관리자 페이지에서 `useState`로 주요 데이터 상태 관리 — 서버 라우터/Server Action 필수
- ❌ `catch {}`로 에러를 무시 — 500 페이지 또는 `toast.error()`로 사용자에게 피드백
- ❌ 관리자 기능에서 `as any` 또는 타입 assertion 남발
- ❌ 일반 사용자가 `/admin` URL을 직접 입력했을 때 500 에러 표시 — `403` 리다이렉트
