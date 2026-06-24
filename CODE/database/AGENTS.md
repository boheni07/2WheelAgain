# 데이터베이스 AGENTS Discipline

## 1. Purpose

데이터 모델 설계, 마이그레이션 관리, Prisma ORM 설정, 쿼리 패턴을 정의합니다.
PostgreSQL 기반의 관계형 데이터 모델을 Prisma로 관리합니다.

## 2. Directory Structure

```
database/
├── AGENTS.md                    # 이 파일
├── prisma/
│   ├── schema.prisma            # Prisma 데이터 모델
│   ├── seed.ts                  # 시드 데이터
│   └── migrations/
│       ├── _original.ts         # 원본 마이그레이션 (검증용)
│       └── ...
├── scripts/
│   ├── migrate-up.sh            # 마이그레이션 적용 스크립트
│   ├── seed-dev.ts              # 개발용 시드 데이터
│   └── health-check.ts          # DB 연결 상태 체크
├── migrations/                  # 마이그레이션 SQL 파일 (Prisma 자동 생성)
│   ├── 20250101000000_init/
│   │   └── migration.sql
│   └── ...
└── tests/
    └── schema.test.ts           # 스키마 검증 테스트
```

## 3. Code Style Rules

### 3.1 Prisma 스키마 작성 규칙

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User — 시스템 사용자
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String
  role      Role     @default(USER)
  phone     String?
  createdAt DateTime @default(now()) @createdAt
  updatedAt DateTime @updatedAt
  bookings  Booking[]

  @@map("users")
}

// Bike — 자전거 정보
model Bike {
  id              String     @id @default(cuid())
  brand           String
  model           String
  year            Int?
  condition       BikeCondition
  price           Decimal?   // null이면 무료/나눔
  priceFree       Boolean    @default(false)
  source          BikeSource // purchase | donation | seized
  images          String[]   // URL 배열
  description     String
  repairNotes     String?
  contactVisible  Boolean    @default(false)
  contactInfo     String?    // 공개될 연락처
  isActive        Boolean    @default(true)
  createdAt       DateTime   @default(now()) @createdAt
  updatedAt       DateTime   @updatedAt
  
  // relationships
  bookings        Booking[]
  activityLogs    ActivityLog[]

  @@index([isActive, condition, priceFree])
  @@index([createdAt])
  @@map("bikes")
}

// Booking — 문의/예약
model Booking {
  id            String    @id @default(cuid())
  type          BookingType
  status        BookingStatus @default(PENDING)
  contactInfo   String?
  note          String?
  respondedAt   DateTime?
  scheduledAt   DateTime?
  completedAt   DateTime?
  createdAt     DateTime  @default(now()) @createdAt
  updatedAt     DateTime  @updatedAt
  
  // relationships
  bike          Bike      @relation(fields: [bikeId], references: [id])
  bikeId        String
  user          User      @relation(fields: [userId], references: [id])
  userId        String
  messages      Message[]

  @@index([status])
  @@index([userId, status])
  @@map("bookings")
}

enum Role {
  USER
  ADMIN
}

enum BikeCondition {
  NEW
  GOOD
  FAIR
  POOR
}

enum BikeSource {
  PURCHASE     // BikeRun이 구매
  DONATION     // 시민 기부
  SEIZED       // 압수물품
}

enum BookingType {
  INQUIRY    // 문의
  PURCHASE   // 구매
  DONATE     // 나눔 신청
}

enum BookingStatus {
  PENDING
  RESPONDED
  SCHEDULED
  COMPLETED
  CANCELLED
}

// 메시지
model Message {
  id        String   @id @default(cuid())
  content   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now()) @createdAt
  
  booking   Booking  @relation(fields: [bookingId], references: [id])
  bookingId String

  @@index([bookingId, createdAt])
  @@map("messages")
}
```

### 3.2 마이그레이션 규칙

- 모든 스키마 변경은 **Prisma migrate**로 관리
- 직접 SQL 수정 금지 — `prisma migrate dev` 또는 `prisma migrate deploy` 사용
- 마이그레이션 전에는 반드시 `prisma validate`로 스키마 검증
- production에서는 `prisma migrate deploy`만 사용 (dev 환경에서 `prisma migrate dev`로 먼저 검증)

```bash
# 개발 환경
prisma migrate dev --name "add_booking_status"
# → migrations/폴더에 SQL 생성 + DB에 적용

# 프로덕션 환경
prisma migrate deploy
# → migrations/폴더의 SQL만 적용 (새 파일 생성 안 함)

# 스키마 검증
prisma validate
```

### 3.3 데이터 조회 패턴

**N+1 문제 방지**: `include` 또는 `select`로 관계 데이터 함께 로드

```typescript
// ❌ N+1 문제
const bikes = await prisma.bike.findMany({ where: { isActive: true } });
for (const bike of bikes) {
  await prisma.booking.findMany({ where: { bikeId: bike.id } });
}

// ✅ include로 한 번에
const bikes = await prisma.bike.findMany({
  where: { isActive: true },
  include: { bookings: true },
});

// ✅ 필요한 필드만 select
const bikes = await prisma.bike.findMany({
  where: { isActive: true },
  select: { id: true, brand: true, model: true, price: true, images: { take: 1 } },
});
```

### 3.4 시드 데이터

개발용 시드 데이터는 `prisma/seed.ts`에서 관리합니다.

```typescript
// DATABASE_URL="postgresql://..." npx prisma db seed
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // 관리자 계정
  const adminEmail = "admin@bikerun.kr";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hash("changeme", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "BikeRun Admin",
        role: "ADMIN",
      },
    });
  }

  // 테스트 자전거 샘플
  const sampleBikes = [
    { brand: "Triple Seven", model: "Luna", condition: "GOOD", price: 50000, description: "도시 주행용 상태 양호한 자전거" },
    { brand: "Cervelo", model: "P3", condition: "FAIR", price: null, priceFree: true, description: "수리 필요하지만 프레임 양호" },
    { brand: "Yuba", model: "K2", condition: "NEW", price: 150000, description: "미사용 카고바이크" },
  ];

  for (const bike of sampleBikes) {
    await prisma.bike.upsert({
      where: { id: bike.brand.toLowerCase().replace(/\s/g, "") },
      create: {
        ...bike,
        id: bike.brand.toLowerCase().replace(/\s/g, ""),
        source: "PURCHASE" as const,
        images: [],
        isActive: true,
      },
      update: {},
    });
  }

  console.log("Seed data created successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 4. Must Do

- ✅ 모든 테이블에 `@@map("snake_case_table")`로 SQL 매핑
- ✅ 모든 모델에 `id @id @default(cuid())` 자동 ID 생성
- ✅ `createdAt` / `updatedAt`는 Prisma built-in decorator 사용
- ✅ 외래 키는 명시적 relation 정의 + `@@index`로 인덱스 생성
- ✅ 마이그레이션 전 `prisma validate` 필수 실행
- ✅ `prisma generate`는 마이그레이션 적용 후 반드시 실행
- ✅ Decimal 필드는 price 등 금액 관련 필드에만 사용
- ✅ Boolean 필드는 `@default(false)` 또는 `@default(true)` 기본값 설정

## 5. Must Not Do

- ❌ 직접 SQL로 테이블 생성/수정 — Prisma migrate만 사용
- ❌ `id`를 number로 사용 — string(cuid)로 통일
- ❌ 민감 정보(비밀번호)를 plain text로 저장
- ❌ `include` 없이 대량 데이터 조회 (N+1 문제)
- ❌ `prisma db push`를 프로덕션에서 사용
- ❌ 스키마 변경 시 `prisma migrate reset` — 데이터 손실 위험
- ❌ `@default(uuid())` — cuid 권장 (가독성 및 디버깅 용이)
- ❌ enum을 string으로 직접 비교 — Prisma enum 사용

## 6. Agent Commands

```bash
# Development
prisma migrate dev              # 마이그레이션 생성 + 적용
prisma migrate dev --name "description"
prisma migrate deploy           # 프로덕션 마이그레이션 적용
prisma db seed                  # 시드 데이터 로드
prisma db push                  # 스키마 동기화 (dev 전용, migrate 대체)
prisma studio                   # GUI 데이터 브라우저
prisma validate                 # 스키마 검증
prisma generate                 # Prisma Client 재생성

# Production
prisma migrate deploy           # 마이그레이션 적용
prisma generate                 # 클라이언트 빌드
```

## 7. File Index (Key Files)

| 파일 | 용도 |
|------|------|
| `prisma/schema.prisma` | 핵심 데이터 모델 정의 |
| `prisma/seed.ts` | 개발용 시드 데이터 |
| `migrations/` | 마이그레이션 SQL 파일 모음 |
| `scripts/health-check.ts` | DB 연결 상태 체크 |
