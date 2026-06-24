# 운영/개발运维 AGENTS Discipline

## 1. Purpose

프로젝트의 빌드, 배포, Docker 컨테이너화, GitHub Actions CI/CD 파이프라인을 정의합니다.
Next.js App Router의 정적/서버 사이드 렌더링 전략에 맞춰 최적화된 환경 설정을 우선시 합니다.

## 2. Directory Structure

```
devops/
├── AGENTS.md                    # 이 파일
├── Dockerfile                   # Next.js 프로덕션 빌드용
├── docker-compose.yml           # 로컬 개발 환경 (App + DB)
├── docker-compose.dev.yml       # 로컬 개발용 추가 서비스 (Portainer 등)
├── .github/
│   └── workflows/
│       ├── ci.yml               # CI: lint, test, build
│       └── cd.yml               # CD: deploy to Vercel/AWS/Fly.io
├── nginx/
│   └── default.conf             # Nginx 프록시 설정 (로컬/서버용)
└── scripts/
    ├── setup.sh                 # 초기 설정 스크립트 (env, deps)
    └── backup-db.sh             # DB 백업 스크립트
```

## 3. Code Style Rules

### 3.1 Docker 설정

`Dockerfile`은 Multi-Stage 빌드를 사용하여 이미지의 크기를 최소화합니다.

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
PATH="$PNPM_HOME:$PATH" RUN pnpm add -g pnpm@9

# Install dependencies only when needed
FROM base AS builder
COPY . ./
RUN pnpm install --frozen-lockfile
RUN pnpm -F frontend build

# Production image
FROM base AS runner
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

### 3.2 Docker Compose (로컬 개발)

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bikerun
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: ./
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    env_file:
      - ./.env
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./frontend:/app/frontend
      - /app/frontend/node_modules

volumes:
  pgdata:
```

### 3.3 CI/CD 파이프라인 (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request, push]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: bikerun_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

## 4. Must Do

- ✅ `.env.example`은 반드시 커밋하고 실제 secrets는 포함하지 않기
- ✅ CI에서는 `pnpm lint && pnpm test && pnpm build`를 순차적으로 실행
- ✅ Docker 컨테이너는 Alpine 기반을 사용하여 크기 최소화
- ✅ 로컬 개발 시 `docker-compose up -d`로 DB를 먼저 기동
- ✅ 마이그레이션은 CI 환경에서 `prisma migrate deploy`로 자동 적용
- ✅ GitHub Secrets에 `DATABASE_URL`과 `NEXTAUTH_SECRET` 저장

## 5. Must Not Do

- ❌ `.env.local`이나 실제 비밀번호를 커밋하지 않기
- ❌ `docker-compose.yml`에 호스트 포트 5432를 노출할 때는 로컬용임을 명시
- ❌ CI에서 `pnpm install` 전 `rm -rf node_modules` 같은 불필요한 정리 하지 않기
- ❌ 프로덕션 빌드 시 `NODE_ENV=development` 사용하지 않기
- ❌ Dockerfile에서 root 사용자로 프로세스 실행하지 않기

## 6. Agent Commands

```bash
# 환경 설정
pnpm setup:all                # 모든 모듈의 의존성 및 환경 설정
pnpm db:setup                 # Docker로 DB 기동 및 마이그레이션

# 빌드
pnpm build:all                # 전체 빌드
pnpm docker:build             # Docker 이미지 빌드
pnpm docker:push              # DockerHub/GCR에 푸시

# 실행
pnpm dev:all                  # 전체 환경 구동
pnpm start:docker             # Docker 컨테이너 구동
```

## 7. File Index (Key Files)

| 파일 | 용도 |
|------|------|
| `Dockerfile` | Next.js 프로덕션 컨테이너화 |
| `docker-compose.yml` | 로컬 DB 및 앱 연동 설정 |
| `.github/workflows/ci.yml` | CI 자동화 규칙 |
| `nginx/default.conf` | 리버스 프록시 설정 |
| `.env.example` | 필수 환경变量 정의 |
