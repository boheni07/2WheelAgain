# 인증/인가 (Auth) AGENTS Discipline

## 1. Purpose

`2WheelAgain` 플랫폼의 인증·인가 아키텍처. NextAuth v5 기반 + SNS OAuth (Naver, KakaoTalk) + JWT 세션 + RBAC 접근 제어.

## 2. Directory Structure

```
frontend/src/lib/
├── auth.ts                    # auth() helper export (frontend/backend 공용)
│   └── NextAuth config        # providers: [Naver, KakaoTalk], session: JWT
└── utils.ts                   # 공통 유틸리티

frontend/src/app/
├── login/page.tsx             # /login — SNS 로그인 버튼
└── (auth)/                    # 인증 그룹 (URL 미노출)
```

## 3. Code Style Rules

### 3.1 NextAuth v5 — SNS OAuth 전용

- **Credentials Provider 비활성화** — 이메일/비밀번호 로그인 금지
- ** providers **: `Naver` + `KakaoTalk` 설정
  - 각 provider의 `client_id`, `client_secret`은 `.env` 전용
  - Naver: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_CALLBACK_URL` (http://localhost:8899/api/auth/callback/naver)
  - KakaoTalk: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_CALLBACK_URL` (http://localhost:8899/api/auth/callback/kakao)
  - `authorizationurl` / `tokenurl` / `profileurl` 은 provider SDK 기준

- **Session 콜백**:
  ```ts
  // session({ session, token }) {
  //   session.user.id = token.sub;
  //   session.user.provider = token.provider as string;
  //   session.user.snsId = token.snsId as string;
  //   session.user.image = token.picture as string;
  //   session.user.role = token.role as string;
  //   return session;
  // }
  ```

- **JWT 콜백**:
  ```ts
  // jwt({ token, account, profile }) {
  //   if (account) { token.provider = account.provider; token.snsId = profile.id; }
  //   // 최초 로그인 시 User.findOrCreate() -> token.role = user.role
  //   return token;
  // }
  ```

- **로그인 페이지**: `/login` — 네이버/카카오톡 로그인 버튼만 (폼 금지)

### 3.2 인가 검증

- `auth()` 호출 후 `session.user.role` 및 `session.user.id` 검증
- admin 전용: `session.user.role !== "ADMIN"` → `403` 응답
- 레이아웃 레벨에서 auth 체크 — 개별 페이지에서 중복 금지

```ts
import { auth } from "@/lib/auth";

const session = await auth();
if (!session) redirect("/login");
if (session.user.role !== "ADMIN") redirect("/");
```

## 4. Must Do

- NextAuth v5 사용 — v4 레거시 금지
- `Naver`/`KakaoTalk` SNS provider만 설정 — `CredentialsProvider` 금지
- `auth()` helper를 반드시 사용 — 클라이언트에서 JWT 수동 관리 금지
- admin 체크는 layout에서 한 번만
- 회원가입 별도 API 없음. OAuth callback에서 `User.findOrCreate()` 자동 생성

## 5. Must Not Do

- `as any` 타입 단언 — `session.user.role` 완전 타입
- JWT 수동 쿠키 관리 — `auth()` helper만
- Credentials(이메일/비밀번호) 로그인 — SNS OAuth 전용
- 미인증 API 직접 호출 — middleware/rbac 반드시 경유
- Plain Text 비밀번호 저장 — SNS OAuth는 비밀번호 사용 안 함
