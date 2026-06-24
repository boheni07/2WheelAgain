# Harness Engineering — 로컬 개발 환경

> `2WheelAgain` — 에이전트 로컬 환경 사양
> 본 문서는 설계 전용입니다. 코드 생성을 포함하지 않습니다.

---

## 1. 사전 요구사항

| 요구사항 | 버전 | 비고 |
|----------|------|------|
| Node.js | >= 20.0.0 | LTS 권장 |
| pnpm | >= 9.0.0 | 워크스페이스 패키지 매니저 |
| PostgreSQL | >= 16.0 | 로컬 인스턴스 |
| Docker (옵션) | >= 24.0 | DB 구축에 권장 |
| Git | >= 2.40.0 | 버전 관리 |

---

## 2. 디렉토리 구조

```
2WheelAgain/
├── frontend/                 # Next.js 15 애플리케이션
│   ├── .env                  # 로컬 환경 변수 (Git 무시)
│   ├── .env.example          # 템플릿 — 저장소에 커밋됨
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma 스키마
│   │   └── seed.ts           # 개발용 시드 스크립트
│   ├── src/
│   │   ├── app/              # App Router 페이지 + API
│   │   ├── lib/              # Prisma 클라이언트, 인증 설정
│   │   ├── schemas/          # Zod 검증 스키마
│   │   └── __tests__/        # Vitest 단위 테스트
│   ├── vitest.config.ts      # Vitest 설정
│   ├── playwright.config.ts  # Playwright E2E 설정
│   ├── tsconfig.json         # TypeScript 설정
│   ├── next.config.ts        # Next.js 설정
│   └── package.json          # 의존성 + 스크립트
├── CODE/                     # Discipline 규칙
│   ├── admin/AGENTS.md
│   ├── auth/AGENTS.md
│   ├── backend/AGENTS.md
│   ├── database/AGENTS.md
│   ├── design/AGENTS.md
│   ├── frontend/AGENTS.md
│   └── testing/AGENTS.md
├── docs/                     # 제품 설계 문서
│   ├── PRD.md
│   ├── system-design.md
│   └── user-flows.md
└── harness/                  # 본 디렉토리
```

---

## 3. 환경 변수

### 3.1 `.env.example` 템플릿

```env
# 데이터베이스
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/twowheelagain?schema=public"

# NextAuth v5
NEXTAUTH_URL="http://localhost:8899"
NEXTAUTH_SECRET="dev-secret-change-in-production-32chars-minimum"

# Naver OAuth
NAVER_CLIENT_ID=""
NAVER_CLIENT_SECRET=""
NAVER_CALLBACK_URL="http://localhost:8899/api/auth/callback/naver"

# KakaoTalk OAuth
KAKAO_CLIENT_ID=""
KAKAO_CLIENT_SECRET=""
KAKAO_CALLBACK_URL="http://localhost:8899/api/auth/callback/kakao"
```

### 3.2 에이전트 제약사항

- 에이전트는 `.env.example` 을 템플릿으로 반드시 읽어야 하며, 비밀값을 하드코딩하면 안 됨
- `.env.local` 은 Git 무시 대상; 에이전트는 `.env.example` 에서 복사하여 생성해야 함
- 데이터베이스 URL은 `localhost:5432` 를 사용; `prisma db migrate` 실행 전 PostgreSQL 인스턴스가 실행 중이어야 함
- `NEXTAUTH_SECRET` 은 32자 이상이어야 함; 에이전트는 실행 시 무작위 시크릿을 생성해야 함
- OAuth 환경 변수는 실제 API 키로 교체 필요 (개발 중에는 빈칸 유지)

---

## 4. 데이터베이스

### 4.1 PostgreSQL 구성

- **호스트**: `localhost:5432` (로컬) 또는 `${PRODUCTION_HOST}` (운영)
- **데이터베이스**: `twowheelagain`
- **사용자**: `postgres`
- **스키마**: `public`

### 4.2 마이그레이션

```bash
# 마이그레이션 생성
pnpm -F frontend prisma migrate dev --name <설명>

# 마이그레이션 적용 (운영)
pnpm -F frontend prisma migrate deploy

# 스키마 동기화 (개발용)
pnpm -F frontend prisma db push
```

- 에이전트는 마이그레이션 생성 시 반드시 `--name` 플래그를 사용해야 함
- `db push`는 운영 환경에서 **금지**

---

## 5. 포트 및 서브도메인

| 서비스 | 포트 | URL |
|--------|------|-----|
| Next.js 개발 서버 | 8899 | `http://localhost:8899` |
| Next.js 운영 서버 | 3000 | `http://localhost:3000` |
| nginx 프록시 | 3003 | `http://local.2wheelagain.com:3003` |
| PostgreSQL | 5432 | `localhost:5432` |
| Prisma Studio | 5555 | `http://localhost:5555` |

---

## 6. 에이전트 시작 프로토콜

에이전트는 작업 시작 전 다음을 확인해야 함:

1. `.env` 파일이 존재하는지 확인 (없으면 `.env.example` 복사)
2. `pnpm install` 이 실행되어 의존성이 최신인지 확인
3. `pnpm -F frontend prisma generate` 가 실행되어 Prisma 클라이언트가 생성되었는지 확인
4. PostgreSQL이 `localhost:5432` 에서 실행 중인지 확인
5. `pnpm -F frontend lint` 및 `pnpm -F frontend typecheck` 가 성공하는지 확인

---

## 7. 운영 환경 (Production)

| 변수 | 운영 값 |
|------|---------|
| `DATABASE_URL` | 운영 PostgreSQL 연결 문자열 |
| `NEXTAUTH_URL` | `https://2wheelagain.com` |
| `NEXTAUTH_SECRET` | 32자 이상 랜덤 문자열 |
| `NAVER_CLIENT_ID` | Naver Developer 등록 ID |
| `NAVER_CLIENT_SECRET` | Naver Developer 등록 Secret |
| `KAKAO_CLIENT_ID` | Kakao Developer 등록 App Key |
| `KAKAO_CLIENT_SECRET` | Kakao Developer 등록 Secret Key |

### 7.1 운영 프로세스

```
운영 프로세스 시나리오 (예시)
┌──────────────────────────────────────────┐
│         nginx (192.168.0.50:3003)        │
│               ↑ HTTPS                     │
│       ┌───────┴────────┐                 │