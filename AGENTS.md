# 2WheelAgain — AGENTS Discipline (Root)

> **프로젝트**: 2WheelAgain — 자전거 업싸이클링/리싸이클링 판매·나눔 플랫폼
> **Version**: V1 (M1–M3)
> **License**: Proprietary (BikeRun Social Enterprise)

---

## 1. 프로젝트 개요

2WheelAgain은 버려지는 자전거를 수리·등록하고 시민이 구매·나눔 신청할 수 있도록 연결하는 매칭 플랫폼입니다.
온라인 결제 및 복잡한 커머스 기능은 V2 이후로 미루고, V1에서는 **기초적인 매칭·예약·소통 기능**에 집중합니다.

### 핵심 원칙

1. **자전거 등록·수리·게시는 BikeRun 관리자만 수행** — 일반 시민은 목록 확인·문의·예약만 가능
2. **V1은 온라인 결제 없음** — 연락·오프라인 거래 중심
3. **상태 기반 접근 제어** — 연락처는 상태 전이(`matched`/`responded` 이상) 이후에만 공개
4. **모든 가이드는 하위 모듈 AGENTS.md에서 상세화** — root는 프로젝트 전체의 컨텍스트 및 네비게이션만 담당

---

## 2. 기술 스택 (V1)

| 분야 | 기술 | 버전 |
|------|------|------|
| **프레임워크** | Next.js 15 (App Router) | `^15.0.0` |
| **언어** | TypeScript | `^5.4.0` |
| **스타일** | Tailwind CSS v4 | `^4.0.0` |
| **UI 컴포넌트** | Radix UI + Headless UI | 최신 |
| **백엔드** | Next.js API Routes | — |
| **ORM** | Prisma | `^5.0.0` |
| **데이터베이스** | PostgreSQL | `^16` (로컬: Docker) |
| **인증** | NextAuth.js v5 | `^5.0.0-beta` |
| **빌드/테스트** | pnpm, Vitest | `^9.0.0` |
| **CI/CD** | GitHub Actions | — |

---

## 3. 프로젝트 구조

```
2WheelAgain/
├── AGENTS.md                    # ← 이 파일 (프로젝트 전체 컨텍스트)
├── opencode.jsonc               # 에이전트/스킬 구성 (V1 — root에 유지)
├── CODE/                        # 코드 디스리플린 모음 (V2)
│   ├── AGENTS.md                # 코드 네이밍 및 import 규칙
│   ├── backend/AGENTS.md        # 백엔드 API 가이드
│   ├── database/AGENTS.md       # DB/마이그레이션 가이드
│   ├── frontend/AGENTS.md       # 프론트엔드 개발 가이드
│   ├── auth/AGENTS.md           # 인증·인가 가이드
│   ├── design/AGENTS.md         # UI/UX 디자인 시스템
│   ├── testing/AGENTS.md        # 테스트 가이드
│   ├── admin/AGENTS.md          # 관리자 기능 가이드
│   └── devops/AGENTS.md         # 빌드·배포 가이드
├── harness/                     # 에이전트/스킬 구성 (V2)
│   ├── opencode.jsonc           # 에이전트 프로파일 매핑
│   ├── agents.md                # Momus/Oracle/Metis 프로파일
│   └── skills.md                # 활용 스킬 목록
├── docs/
│   ├── PRD.md                   # Product Requirements Document
│   ├── design/
│   │   └── system-design.md     # 시스템 설계 요약
│   └── user-flows.md            # 주요 사용자 여정
├── frontend/                    # 실제 프론트엔드 코드 (Next.js App Router)
│   ├── .editorconfig
│   └── ...
├── backend/                     # 실제 백엔드 코드
│   └── ...
├── database/                    # 실제 DB 코드 (Prisma)
│   └── prisma/
│       └── schema.prisma
├── testing/                     # 실제 테스트 코드
│   └── ...
├── design/                      # 디자인 리소스 (토큰, 아이콘)
│   └── tokens/
├── admin/                       # admin 대시보드
│   └── ...
├── auth/                        # 인증 구현
│   └── ...
└── devops/
    └── Dockerfile
```

> ⚡ **Discipline AGENTS.md V2**: 코드 관련 모든 가이드 파일은 `CODE/` 하위로 통합됨.
> 새 프로젝트를 시작하거나 관련 모듈을 작업할 때는 `CODE/*/AGENTS.md`를 참조.
> (기존 위치 `backend/`, `frontend/`, `design/` 등에 있는 AGENTS.md 파일은
>  V1 레거시 — 최신 버전은 `CODE/` 아래 있으니 무시하고 `CODE/*/AGENTS.md`를 읽어.)

### 코드 작업 시 참조 가이드 읽기 순서

| # | 파일 | 읽을 때 |
|---|------|---------|
| 1 | `AGENTS.md` (이 파일) | 처음 시작 — 프로젝트 컨텍스트 |
| 2 | `CODE/AGENTS.md` | 네이밍/import/에러 처리 규칙 |
| 3 | `CODE/database/AGENTS.md` | 데이터 모델/Prisma 작업 |
| 4 | `CODE/auth/AGENTS.md` | 인증/인가 작업 |
| 5 | `CODE/backend/AGENTS.md` | API 라우트/서비스 개발 |
| 6 | `CODE/frontend/AGENTS.md` | 컴포넌트/페이지 개발 |
| 7 | `CODE/design/AGENTS.md` | 스타일/디자인 토큰 작업 |
| 8 | `CODE/admin/AGENTS.md` | 관리자 화면 개발 |
| 9 | `CODE/testing/AGENTS.md` | 테스트 코드 작성 |
| 10 | `CODE/devops/AGENTS.md` | 빌드/배포 작업 |

---

## 4. 전역 코드 규칙

### 4.1 네이밍 컨벤션

| 항목 | 규칙 | 예시 |
|------|------|------|
| 파일명 (프론트엔드) | PascalCase (페이지) / camelCase (컴포넌트, 유틸리티) | `BikeCard.tsx`, `useBikeFilter.ts` |
| 파일명 (백엔드) | camelCase | `bikes.ts`, `auth.ts` |
| 인터페이스/타입 | PascalCase, `I` 접두사 금지 — `Bike`, `Booking` | `interface BikeListing` |
| 상수 | UPPER_SNAKE_CASE | `MAX_IMAGE_SIZE` |
| 변수 | camelCase | `bikeCount` |
| 함수 | camelCase, action-prefix | `fetchBikes()`, `handleBooking()` |
| DB 컬럼 | snake_case (Prisma 스키마) | `created_at`, `source_type` |

### 4.2 import 순서

```
1. node.builtins  (fs, path, url)
2. 외부 라이브러리 (react, next, @prisma/client)
3. 절대 경로 @/  (config/, lib/, types/)
4. 상대 경로  (./, ../)
```

### 4.3 에러 처리

- `try/catch`는 항상 구체적인 에러 로깅과 함께 사용
- `as any`, `@ts-ignore`, `@ts-expect-error` **전혀 금지**
- 에러는 `AppError` 클래스로 래핑하여 일관된 메시지 전달
- 사용자-facing 에러는 **구체적인 상황만** 표시 — 기술 세부사항 노출 금지

### 4.4 타입 안전성

- 모든 API 응답, 컴포넌트 prop, 상태 변수에 명시적 타입 정의
- `unknown`은 반드시 narrow 후 사용
- `Record<string, any>` 대신 인터페이스 사용

### 4.5 Git 컨벤션

```
<type>(<scope>): <subject>

types: feat, fix, docs, style, refactor, test, chore, ci, perf
```

예시:
```
feat(bikes): 자전거 목록 필터 기능 추가
fix(admin): 자전거 상태 전이 로직 버그 수정
docs(prd): V2-V3 로드맵 업데이트
```

---

## 5. 핵심 도메인 규칙

### 5.1 도메인 모델 (Prisma 스키마 기반)

| 엔티티 | 설명 | 주요 필드 |
|--------|------|-----------|
| `User` | 시스템 사용자 (관리자/시민) | `id, email, role, name, phone` |
| `Bike` | 자전거 정보 | `id, brand, model, condition, price_or_free, images[], source, repair_notes` |
| `Booking` | 문의·예약 | `id, bikeId, userId, type(inquiry|purchase|donate), status, contact, messages[]` |
| `ActivityLog` | 운영 로그 | `id, actorId, action, entityType, entityId, metadata` |

> **핵심 규칙**: `owner_id` 삭제 — 자전거 등록은 오직 BikeRun 관리자만.
> `Bike.source`로 `purchase` / `donation` / `seized` 구분.

### 5.2 상태 머신 (Booking)

```
pending → responded → scheduled → completed
   ↓          ↓           ↓
 cancelled  cancelled   cancelled
```

- 상태는 Prisma enum으로 정의
- 상태 전이는 Prisma Middleware + API Route 검증 쌍으로 보호
- 상태 전이 조건은 `CODE/database/AGENTS.md` 상세

### 5.3 역할 기반 접근 (RBAC)

| 엔티티 | public | 관리자 |
|--------|--------|--------|
| `/bikes` 목록 | ✅ 읽기 | ✅ 읽기 + 필터 |
| `/bikes/:id` 상세 | ✅ 읽기 | ✅ 읽기 + 수정 |
| `/admin/bikes/*` | ❌ 403 | ✅ 전액 |
| `Booking` 생성 | ✅ | ✅ |
| `Booking` 상태 변경 | ❌ | ✅ |

> 상세RBAC 규칙은 `CODE/auth/AGENTS.md` 참조

### 5.3 역할 기반 접근 (RBAC)

| 엔티티 | public | 관리자 |
|--------|--------|--------|
| `/bikes` 목록 | ✅ 읽기 | ✅ 읽기 + 필터 |
| `/bikes/:id` 상세 | ✅ 읽기 | ✅ 읽기 + 수정 |
| `/admin/bikes/*` | ❌ 403 | ✅ 전액 |
| `Booking` 생성 | ✅ | ✅ |
| `Booking` 상태 변경 | ❌ | ✅ |

---

## 6. 빌드 및 실행 명령어

```bash
# 루트 실행 명령어 (monorepo style)
pnpm build:all       # 전체 빌드
pnpm dev:all         # 전체 development 서버 (frontend + backend + db)
pnpm test:all        # 전체 테스트

# 모듈별
pnpm -F frontend build
pnpm -F frontend dev
pnpm -F backend test
pnpm -F database migrate:apply
pnpm -F database migrate:rollback
```

### 필수 도구

- `node ≥ 20`, `pnpm ≥ 9`
- `docker ≥ 24` (PostgreSQL 컨테이너용)
- `volta` 또는 `nvm` (Node 버전 관리)

---

## 7. 개발 작업 플로우

### 새 기능 개발

1. `docs/PRD.md`의 Feature Spec 참조 → 구현 범위 확인
2. 데이터 모델 변경 필요? → `database/AGENTS.md`에 따라 `.prisma` 수정 후 마이그레이션
3. 백엔드 API 먼저 (TDD) → `testing/AGENTS.md`에 따라 테스트 먼저 작성
4. 프론트엔드 연동 → `frontend/AGENTS.md` + `design/AGENTS.md` 가이드 준수
5. 관리자 화면 (해당 시) → `admin/AGENTS.md` 가이드 준수
6. LSP diagnostics + lint + test → 모든 통과 확인 후 커밋

### 버그 수정

1. PRD Feature Spec에서 해당 기능의 의도 확인
2. 원인 분석 → 최소한의 변경으로 수정
3. 관련 테스트 추가 (레퍼런스)
4. 기존 테스트 모든 통과 확인

### 리팩터링

1. 먼저 테스트 커버리지 확인
2. Prisma enum/인터페이스 변경 → 모든 사용하는 곳 검색 (`grep`/`lsp_find_references`)
3. 한 번에 한 모듈만 리팩터링 — 한 파일 당 최대 500 줄 변경

---

## 8. AGENTS.md 파일 구조 표준

모든 모듈 AGENTS.md는 다음 구조를 따라야 합니다:

```
# Module AGENTS

## 1. Purpose
## 2. Directory Structure
## 3. Code Style Rules
## 4. Must Do
## 5. Must Not Do
## 6. Agent Commands (dev/test/build)
## 7. File Index (key files)
```

---

## 9. 참고 링크

| 항목 | 위치 |
|------|------|
| PRD (기능 명세서) | `docs/PRD.md` |
| 디자인 가이드 | `CODE/design/AGENTS.md` |
| DB 스키마 | `database/prisma/schema.prisma` |
| API 레퍼런스 | `CODE/backend/AGENTS.md` |
| 인증 설정 | `CODE/auth/AGENTS.md` |
| 테스트 레퍼런스 | `CODE/testing/AGENTS.md` |
| 관리자의 기능 가이드 | `CODE/admin/AGENTS.md` |
| 시스템 설계 | `docs/design/system-design.md` |
| 사용자 흐름 | `docs/user-flows.md` |
| 에이전트 구성 | `harness/opencode.jsonc` |
