# Harness Engineering — CI/CD 파이프라인

> `2WheelAgain` — Continuous Integration/Continuous Design 명세
> 본 문서는 설계 전용입니다. 코드 생성을 포함하지 않습니다.

---

## 1. 개요

`2WheelAgain`의 CI 파이프라인은 **GitHub Actions 최적화**됩니다. 리포지토리에 Dockerfile 포함하지 않으며, 파이프라인은 `ubuntu-latest` 러너에서 직접 실행됩니다.

### 1.1 파이프라인 단계

| 단계 | 트리거 | 설명 |
|------|--------|------|
| **Lint** | PR / main 푸시 | ESLint strict 모드 |
| **Typecheck** | PR / main 푸시 | `tsc --noEmit` |
| **Unit Tests** | PR / main 푸시 | Vitest — 모든 스키마, 유틸리티, 컴포넌트 |
| **E2E Tests** | PR (main 병합 후 검토) | Playwright — 5개 핵심 흐름 |
| **Build** | main 푸시 | `next build` 프로덕션 검증 |
| **Deploy** | main 병합 | Docker Compose → nginx 프록시 (192.168.0.50:3003) |

### 1.2 브랜치 전략

```
main
  └── feature/<description>   (전체 작업)
      └── hotfix/<description>  (긴급 main 수정)
```

- **main**: 항상 빌드 가능 — 보호된 브랜치
- **feature/**: PR 생성 — 모든 CI 단계 통과 시 병합 가능
- **hotfix/**: 긴급 시 lint 스킵 가능,ただし test + build MUST pass

---

## 2. GitHub Actions 워크플로우

### 2.1 CI 워크플로우

```yaml
# .github/workflows/ci.yml (명세만 기록)

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: twowheelagain_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm -F frontend prisma db push --skip-generate
      - run: pnpm -F frontend prisma generate

      - run: pnpm -F frontend lint
      - run: pnpm -F frontend typecheck
      - run: pnpm -F frontend test
      - run: pnpm -F frontend build

    env:
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/twowheelagain_test"
      NEXTAUTH_SECRET: "ci-test-secret-32-chars-minimum-here"
      NEXTAUTH_URL: "http://localhost:3000"
      NAVER_CLIENT_ID: "ci-mock"
      NAVER_CLIENT_SECRET: "ci-mock"
```

### 2.2 CD 워크플로우 (프로덕션 배포)

```yaml
# .github/workflows/cd.yml (명세만 기록)

name: CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm -F frontend prisma db push --skip-generate
      - run: pnpm -F frontend prisma generate
      - run: pnpm -F frontend build

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: 192.168.0.50
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/twowheelagain
            git pull origin main
            docker compose up -d --build
```

---

## 3. 로컬 개발 워크플로우

```bash
# 파이프라인 로컬 테스트 (CI 전 검증)
pnpm test:all        # 전체 테스트 실행
pnpm build           # 프로덕션 빌드 검증
pnpm lint:fix        # 린트 자동 수정

# 마이그레이션 적용
pnpm db:migrate      # Prisma 마이그레이션 실행
```

---

## 4. 에이전트 CI/CD 제약사항

- 모든 PR은 CI 단계를 반드시 통과해야 병합 가능
- `feature/*` 브랜치 생성 시 CI 자동 실행
- `main` 브랜치는 **보호된 브랜치** — 직접 푸시 불가
- 배포는 GitHub Actions 자동화 (수동 SSH 접근禁止)
- SECRET 키는 GitHub Secrets 또는 SSH Private Key로 관리

---

## 5. 환경 변수 관리

| 환경 | 위치 | 관리 방식 |
|------|------|-----------|
| **로컬** | `.env.local` | gitignore (개인 키) |
| **CI/CD** | GitHub Secrets | `NEXTAUTH_SECRET`, `NAVER_*`, `KAKAO_*` |
| **프로덕션** | 서버 `/opt/twowheelagain/.env` | SSH Private Key 배포 |
| **테스트** | CI 환경 변수 | `ci.yml` 내 `env` 섹션 |
