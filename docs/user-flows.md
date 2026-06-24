# 사용자 흐름 (User Flows)

> `2WheelAgain` — 주요 사용자 여정
> V1 — 연락/오프라인 거래 중심

---

## 1. 역할 정의

| 역할 | 설명 | 접근 범위 |
|------|------|-----------|
| **SYSTEM_ADMIN** | 시스템 전체 관리자 | 전체 접근 |
| **ADMIN** | BikeRun 관리자 (자전거 등록/수리/상태 변경) | /admin/*, /api/admin/* |
| **CITIZEN** | 일반 시민 (목록 확인/문의/예약) | /bikes/*, /bookings/*, /login, /register |

> ⚠️ **핵심 원칙**: 자전거 등록·수리·게시는 BikeRun 관리자만 수행. 일반 시민은 목록 확인·문의·예약만 가능.

---

## 2. 인증/인가 흐름

### 2.1 로그인

```
[Citizen/Admin] -> [GET /login] -> [LoginPage (Client)]
  - 이메일 + 비밀번호 입력 (Zod 검증)
  - POST /api/auth/* (NextAuth handler) -> Credentials Provider
    - bcrypt.compare
    - JWT 생성 (role 포함)
    - 쿠키에 저장
  - 세션 생성 -> 원래 페이지로 리다이렉트
```

**에러 케이스:**
- `INVALID_CREDENTIALS` — 잘못된 이메일/비밀번호
- `FORBIDDEN` — 관리자 페이지 접근 시 역할 없음

### 2.2 회원가입

```
[Visitor] -> [GET /register] -> [RegisterPage (Client)]
  - 이메일 + 비밀번호 + 이름 입력 (Zod 검증)
  - POST /api/auth/register
    - duplicate email 체크
    - bcrypt hash
    - User 생성 (role: CITIZEN)
  - 자동 로그인 -> /bikes 리다이렉트
```

### 2.3 인가 검증

**Server Component:**
```tsx
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user) {
  redirect("/login?error=UNAUTHORIZED");
}
```

**Admin Routes:**
```tsx
// admin/layout.tsx (모든 admin 라우트에서 강제)
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

## 3. 관리자 — 자전거 관리 흐름

### 3.1 자전거 등록

```
[ADMIN] -> [GET /admin/bikes/new] -> [NewBikeForm (Client)]
  - brand, model, condition, price, source, images, description 입력
  - Zod 검증 (bikeCreateSchema)
  - POST /api/bikes (Server Action / API Route)
    - BikeService.create() -> Prisma.create()
    - ActivityLog.log(actorId, "BIKE_CREATED", bike.id)
  - 리다이렉트: /admin/bikes/[id] (상세) 또는 /admin/bikes (목록)
```

**필수 입력:** brand, model, condition, description
**선택 입력:** year, price, images, repairNotes, contactInfo

### 3.2 자전거 목록 관리

```
[ADMIN] -> [GET /admin/bikes] -> [AdminBikesPage (Server)]
  - auth() -> ADMIN 체크
  - Prisma query: getBikes({ page, limit, filter, search })
  - DataTable + Pagination 조합으로 표시
  - 상태별 Badge color (available=green, reserved=yellow, in_shop=red...)
```

### 3.3 자전거 상세/수정

```
[ADMIN] -> [GET /admin/bikes/[id]] -> [AdminBikeDetailPage (Server)]
  - Prisma: bikeWith({ bookings, activityLogs })
  - 이미지 갤러리, 상태 정보, 예약 내역 표시
  - [Edit Button] -> /admin/bikes/[id]/edit (Client)
      - 수정 폼 -> PUT /api/bikes/[id] -> BikeService.update()
      - ActivityLog.log(actorId, "BIKE_UPDATED", bike.id)
```

---

## 4. 관리자 — 예약 관리 흐름

### 4.1 예약 상태 전이

```
Booking 상태 흐름:
pending -> responded -> scheduled -> completed
   ↓          ↓           ↓
 cancelled  cancelled   cancelled

조건:
- pending -> responded: ADMIN만 가능
- responded -> scheduled: ADMIN만 가능
- scheduled -> completed: ADMIN만 가능 (OR Citizen가 완료 확인)
- 어떤 상태든 -> cancelled: ADMIN 또는 Citizen (자신의 예약인 경우)
```

### 4.2 예약 상태 변경

```
[ADMIN] -> [GET /admin/bookings/[id]] -> [AdminBookingDetailPage (Server)]
  - Prisma: bookingWith({ bike, user })
  - 상태 변경 폼 (BookingStatusForm)
  - POST /api/bookings/[id]/transition
    - Zod 검증: transitionSchema.safeParse({ status, note })
    - BookingService.transitionStatus(bookingId, newStatus, actorId, context)
    - ActivityLog.log(actorId, "BOOKING_STATUS_CHANGED", bookingId, { from, to })
    - 리다이렉트: /admin/bookings
```

### 4.3 예약 목록

```
[ADMIN] -> [GET /admin/bookings] -> [AdminBookingsPage (Server)]
  - Prisma: getBookings({ page, limit, filter })
  - DataTable: type, status, bikeName, userName, createdAt
  - 필터: status, type, dateRange
```

---

## 5. 시민 — 자전거 목록/상세 흐름

### 5.1 자전거 목록 조회

```
[VISITOR/CITIZEN] -> [GET /bikes] -> [BikesPage (Server Component)]
  - Prisma.query: getPublicBikes({ isActive, condition, priceFree })
  - BikeFilter 컴포넌트 (상태, 가격대 필터)
  - BikeCard 조합으로 표시
  - 상태별 뱃지: available=green, reserved=warning
```

### 5.2 자전거 상세 조회

```
[VISITOR/CITIZEN] -> [GET /bikes/[id]] -> [BikeDetailPage (Server Component)]
  - Prisma: bikeWith({ bookings, activityLogs })
  - 이미지 갤러리, 브랜드, 모델, 상태, 가격, 설명 표시
  - [문의하기 버튼] -> /bikes/[id]/inquire (Client)
  - [나눔신청 버튼] -> /bikes/[id]/donate-apply (Client)
```

### 5.3 문의/예약

```
[AUTHENTICATED CITIZEN] -> [GET /bikes/[id]/inquire] -> [InquiryForm (Client)]
  - zod 검증: inquirySchema.safeParse({ message, contactInfo })
  - Prisma: Booking.create({
      bikeId,
      userId,
      type: "inquiry",
      status: "pending"
    })
  - ActivityLog.log(userId, "BOOKING_CREATED", bookingId)
  - 리다이렉트: /bookings
```

---

## 6. 시민 — 내 예약 흐름

### 6.1 예약 목록 조회

```
[AUTHENTICATED CITIZEN] -> [GET /bookings] -> [UserBookingsPage (Server)]
  - auth() -> session
  - Prisma: getBookings({ where: { userId: session.userId } })
  - 상태별 뱃지로 현재 상태 표시
  - 예약 상세 링크 -> /bookings/[id]
```

### 6.2 예약 상세

```
[CITIZEN] -> [GET /bookings/[id]] -> [BookingDetailPage (Server)]
  - auth() -> session
  - Prisma: bookingWith({ bike })
  - 본인 소유 여부 확인 (userId === session.userId), 권한 없는 경우 403
  - 상태 타임라인 표시, 메시지 읽기
```

---

## 7. 관리자 대시보드 흐름

### 7.1 대시보드 오버뷰

```
[SYSTEM_ADMIN] -> [GET /admin] -> [AdminDashboardPage (Server)]
  - auth() -> ADMIN 체크
  - Prisma aggregations:
    - 총 자전거 수 (isActive)
    - 활성 예약 수 (status in [pending, responded])
    - 이번 달 신규 자전거
    - 최신 활동 로그 (ActivityLog.slice(20))
  - MetricCard 조합으로 표시
  - generateMetadata()에서 페이지 메타 태그 설정
```

### 7.2 이용 통계

```
[SYSTEM_ADMIN] -> [GET /admin/analytics] -> [AnalyticsPage (Server)]
  - Prisma: 날짜별 자전거 등록 수, 예약 상태 변경 수
  - 차트 컴포넌트 (선택)
```

---

## 8. 상태 기반 접근 제어

### 8.1 연락처 공개 규칙

```
| 상태          | 연락처 공개? | 공개 대상 |
|---------------|------------|-----------|
| pending       | ❌         | 누구도    |
| responded     | ⚠️         | ADMIN만   |
| scheduled     | ⚠️         | ADMIN + 예약 시민 |
| completed     | ⚠️         | ADMIN + 예약 시민 |
| cancelled     | ❌         | Nobody    |

핵심: 상태 전이가 완료된 경우에만 연락처가 공개됨
```

### 8.2 상태 흐름 다이어그램

```
                    ┌─────────┐
                    │  Bike   │
                    └────┬────┘
                         │ 1──N
                    ┌────▼────┐     N──1     ┌────────┐
                    │ Booking │◄─────────────│  User  │
                    └────┬────┘               └────────┘
                         │
                    ┌────▼──────────────────────────┐
                    │       상태 전이               │
                    └────┬──────────────────────────┘
┌───────────┐  ┌───────▼───────┐  ┌───────────┐  ┌───────────┐
│ pending   ├──►│ responded     ├──►│ scheduled │──►│ completed │
└─────┬─────┘  └───────┬───────┘  └───────┬────┘  └───────────┘
      │                │                  │
      ▼                ▼                  ▼
 ┌──────────┐    ┌──────────┐     ┌──────────┐
 │ cancelled│    │ cancelled│     │ cancelled│
 └──────────┘    └──────────┘     └──────────┘
```

---

## 9. 구조 참고

- **디iscipline 규칙:** `CODE/*/AGENTS.md` 파일별 개발 가이드
- **에이전트 구성:** `harness/opencode.jsonc`
- **에이전트 프로파일:** `harness/agents.md`
- **스킬 정의:** `harness/skills.md`
