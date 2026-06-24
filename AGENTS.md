# 2WheelAgain — AGENTS Discipline (Root)

> **프로젝트**: 2WheelAgain — 자전거 업싸이클링/리싸이클링 판매·나눔 플랫폼
> **Version**: V1 (연락·오프라인 거래 중심, 온라인 결제는 V2 이후)

---

## 1. 기술 스택

| 분야 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript `^5.4.0` |
| 스타일 | Tailwind CSS v4 `^4.0.0` |
| UI | Radix UI + Shadcn |
| ORM | Prisma `^5.0.0` / PostgreSQL `^16` (Docker) |
| 인증 | NextAuth.js v5 (JWT) |
| 검증 | Zod |
| 테스트 | Vitest + Playwright |

## 2. 프로젝트 구조

```
2WheelAgain/
├── AGENTS.md              ← 이 파일 (컨텍스트 및 네비게이션)
├── CODE/                  ← discipline 가이드 (하위 AGENTS.md 모두 참조)
│   ├── admin/             # 관리자 대시보드 (RBAC)
│   ├── auth/              # NextAuth v5, JWT, SNS OAuth (Naver + KakaoTalk)
│   ├── backend/           # API 라우트 구조, Zod 검증, 에러 포맷
│   ├── database/          # Prisma 스키마, 마이그레이션, 상태 전이
│   ├── design/            # Tailwind 토큰, 컴포넌트 패턴
│   ├── frontend/          # Next.js App Router, 페이지, 컴포넌트
│   └── testing/           # Vitest + Playwright 전략
├── docs/                  # PRD, 시스템 설계, 사용자 흐름
└── frontend/              # Next.js app root (src/)
    ├── prisma/
    │   └── schema.prisma  # User, Bike, Booking, ActivityLog, Article
    └── src/
        ├── app/           # App Router 페이지 + API 라우트
        ├── components/    # 재사용 UI 컴포넌트
        └── lib/           # shared utilities (Prisma client, auth)
```

> ⚡ 코드 작업 시 `CODE/*/AGENTS.md` 참조.

## 3. 전역 규칙

- `as any`, `@ts-ignore`, `@ts-expect-error` **전혀 금지**
- Empty catch blocks 금지
- `Record<string, any>` 대신 명시적 인터페이스 사용
- Import 순서: `node.builtins → 외부 라이브러리 → @/ 절대 경로 → ./ 상대 경로`

### 네이밍

| 항목 | 규칙 | 예시 |
|------|------|------|
| 페이지 파일 | PascalCase | `BikeDetailPage` → `bikes/[id]/page.tsx` |
| 컴포넌트/유틸 | camelCase | `useBikeFilter` |
| 타입/인터페이스 | PascalCase (I prefix 금지) | `interface Bike` |
| 상수 | UPPER_SNAKE_CASE | `MAX_IMAGE_SIZE` |

## 4. 핵심 도메인

### 4.1 RBAC

| 엔티티 | public | ADMIN |
|--------|--------|--------|
| `/bikes` 목록 | ✅ 읽기 | ✅ 읽기 + 필터 |
| `/bikes/:id` 상세 | ✅ 읽기 | ✅ 읽기 + 수정 |
| `/admin/*` | ❌ 403 | ✅ full |
| `Booking` 생성 | ✅ (회원) | ✅ |
| `Booking` 상태 변경 | ❌ | ✅ |

### 4.2 Booking 상태 전이

```
pending → responded → scheduled → completed
   ↓          ↓           ↓
cancelled  cancelled   cancelled
```

- 상태 변경은 API 라우트 경유 + Zod 검증
- admin role 체크는 `auth()` 호출 후 session.role 검증

### 4.3 핵심 Entities (Prisma)

| Model | 주요 필드 |
|-------|-----------|
| `User` | id, email, name, phone, imageUrl, provider(SNSProvider), snsId, role(UserRole) |
| `Bike` | id, brand, model, year, condition, price, source, images, status(BikeStatus), repairNotes |
| `Booking` | id, bikeId, userId, type(BookingType), status(BookingStatus), contactInfo, note |
| `ActivityLog` | id, actorId, action, entityType, entityId, metadata(jsonb) |
| `Article` | id, title, slug(unique), excerpt, content, coverImage?, authorId(FK), status(ArticleStatus), category, publishedAt?, createdAt, updatedAt |

## 5. 실행 명령어

```bash
pnpm -F frontend dev    # dev 서버
pnpm -F frontend build  # 빌드
pnpm -F database migrate:apply  # DB 마이그레이션
```

## 6. 참조

| 항목 | 위치 |
|------|------|
| PRD | `docs/PRD.md` |
| DB 스키마 | `frontend/prisma/schema.prisma` |
| API 레퍼런스 | `CODE/backend/AGENTS.md` |
| 인증 설정 | `CODE/auth/AGENTS.md` |
| 관리자 | `CODE/admin/AGENTS.md` |
| 테스트 | `CODE/testing/AGENTS.md` |
