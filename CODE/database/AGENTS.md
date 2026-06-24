# 데이터베이스 (Database) AGENTS Discipline

## 1. Purpose

Prisma schema, 마이그레이션, 데이터 쿼리 패턴. PostgreSQL backend.

## 2. Entity Model

| Model | Table | 주요 필드 |
|-------|-------|----------|
| `User` | users | email, name, phone, imageUrl, provider(SNSProvider), snsId, role(UserRole) |
| `Bike` | bikes | brand, model, year, condition, price, source(enum), images(string[]), status(BikeStatus), repairNotes? |
| `Booking` | bookings | bikeId, userId, type(enum), status(enum), contactInfo?, note? |
| `ActivityLog` | activity_logs | actorId, action, entityType, entityId, metadata(jsonb) |
| `Article` | articles | title, slug(unique), excerpt, content, coverImage?, authorId(FK), status(ArticleStatus), category, publishedAt?, createdAt, updatedAt |

## 3. Enums

```
SNSProvider: NAVER | KAKAO
UserRole: USER | ADMIN
BikeStatus: AVAILABLE | SOLD | MAINTENANCE
BookingType: INQUIRY | RESERVATION
BookingStatus: PENDING | RESPONDED | SCHEDULED | COMPLETED | CANCELLED
ArticleStatus: DRAFT | PUBLISHED
```

## 3.1 User Model — SNS OAuth 필드

`User` 모델에 SNS OAuth 관련 필드 추가 — `password` 필드 완전히 제거:

| 필드 | 타입 | 설명 | 제약 |
|------|------|------|------|
| `email` | `String?` | OAuth profile에서 가져온 이메일 | unique, nullable (SNS에 따라 미제공 가능) |
| `name` | `String?` | OAuth profile에서 가져온 이름 | nullable |
| `imageUrl` | `String?` | OAuth profile에서 가져온 프로필 이미지 | nullable |
| `provider` | `SNSProvider` | 로그인 provider | `NAVER` 또는 `KAKAO` |
| `snsId` | `String` | SNS 고유 계정 ID | unique, not null — 중복 불가 |
| `role` | `UserRole` | RBAC 역할 | `USER`(default), `ADMIN` |

**`password` 필드 완전 제거** — Credentials 로그인 지원하지 않음.

### 3.1.1 User Model — 중복 방지

`snsId` + `provider` 조합으로 user를 create/upsert 합니다:

```ts
// 첫 로그인: 자동 가입
const user = await prisma.user.upsert({
  where: { snsId_provider: { snsId, provider } },
  update: {},
  create: {
    snsId,
    provider,
    email: profile.email ?? null,
    name: profile.name,
    imageUrl: profile.imageUrl ?? null,
    role: "USER", // 자동 생성 시 기본 ROLE
  },
});
```

`snsId_provider` unique index는 Prisma schema에서 선언:
```prisma
@@unique([provider, snsId])
```

## 4. Code Style Rules

### 4.1 Prisma Query

- `src/lib/prisma.ts`에서 singleton export
- Server Component 또는 API route에서 직접 조회

```ts
const bikes = await prisma.bike.findMany({
  where: { status: BikeStatus.AVAILABLE },
  orderBy: { createdAt: "desc" },
  skip, take,
});
```

### 4.2 Booking Status Transitions

Prisma + API 라우트에서 상태 전이 검증:
```
pending → responded → scheduled → completed
   ↓          ↓           ↓
cancelled  cancelled   cancelled
```

```ts
const validTransitions: Record<string, string[]> = {
  pending: ["responded", "cancelled"],
  responded: ["scheduled", "cancelled"],
  scheduled: ["completed", "cancelled"],
};
```

## 5. Must Do

- schema 변경 → `prisma migrate dev --name description`
- `User` 모델에 `provider`, `snsId`, `imageUrl` 필드가 반드시 존재해야 함
- `user_snsId_provider` unique index 필수 (중복 가입 방지)
- `password` 필드 완전 제거 — 코드 어디에서도 참조하지 않음
- Booking 상태 변경은 전이 규칙 필수 검증
- admin 전용은 API 라우트에서 session.role 검증

## 6. Must Not Do

- Raw SQL — Prisma Query Builder만 사용
- `as any` 타입 단언
- 미검증 booking 상태 직접 update
