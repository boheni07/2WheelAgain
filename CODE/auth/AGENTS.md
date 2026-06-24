# 인증/인가 (Auth) AGENTS Discipline

## 1. Purpose

`2WheelAgain` 플랫폼의 인증(Authentication) 및 인가(Authorization) 아키텍처를 정의합니다.
NextAuth.js v5를 사용하여 세션 기반 인증을 수행하며, JWT 쿠키를 통한 역할(Role) 기반 접근 제어(RBAC)를 적용합니다.

## 2. Architecture Overview

```
[Citizen] --login--> [NextAuth / API /api/auth/*] --verify JWT--> [Session + Role]
                                                       |
                                                       v
                                              [RBAC Middleware / layout]
                                                 - /admin/* -> role === ADMIN
                                                 - /bookings/* -> userId === session.userId
```

## 3. Directory Structure

```
auth/
├── AGENTS.md                    # 이 파일
├── lib/
│   ├── auth.config.ts           # NextAuth.js v5 설정 (Callbacks, Events)
│   ├── auth.ts                  # auth() helper export (frontend/backend 공용)
│   └── rbac.ts                  # 역할 기반 접근 검증 유틸
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts         # NextAuth handler (App Router)
│       └── register/
│           └── route.ts         # POST /api/auth/register — 회원가입 API
components/
├── auth/
│   ├── LoginPage.tsx            # 로그인 폼
│   ├── RegisterPage.tsx         # 회원가입 폼
│   └── UserMenu.tsx             # 헤더 내 사용자 메뉴 (로그인 상태 표시)
```

## 4. Code Style Rules

### 4.1 NextAuth.js 설정

```ts
// auth/lib/auth.config.ts
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default {
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;
        const { email, password } = validated.data;
        // 1. DB에서 사용자 조회
        // 2. bcrypt.compare(password, hashedPassword)
        // 3. 성공 시 User 객체 반환, 실패 시 null
        return { id: "1", email, name: "User", role: "USER" };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token?.role) {
        (session.user as any).role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
} satisfies NextAuthConfig;
```

### 4.2 인가 (Authorization) 검증

```ts
// auth/lib/rbac.ts
import { auth } from "@/auth/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}
```

### 4.3 RBAC 체크 패턴 (Server Component)

```tsx
// admin/layout.tsx
import { requireAdmin } from "@/auth/lib/rbac";

export default async function AdminLayout({ children }) {
  await requireAdmin(); // 강제 리다이렉트 또는 throw
  return children;
}
```

## 5. Must Do

- ✅ 모든 인증 체크는 `auth/lib/rbac.ts`의 `requireAuth()` / `requireAdmin()` 함수를 통해 일원화
- ✅ 비밀번호는 `bcrypt`로 해시하여 DB에 저장 (rounds >= 10)
- ✅ JWT 토큰은 `httpOnly`, `secure`, `sameSite=strict` 쿠키에 저장
- ✅ `auth()` 호출은 항상 `async`이며, Server Component에서 직접 호출 가능
- ✅ 회원가입 시 이메일 중복 체크 필수

## 6. Must Not Do

- ❌ 토큰을 `localStorage`에 저장하지 않기 — 쿠키 기반 세션만 사용
- ❌ `as any`를 사용하여 Session 타입을 우회하지 않기
- ❌ 비활성화된 사용자 계정의 로그인 허용하지 않기
- ❌ 비밀번호를 로그나 에러 메시지에 포함하지 않기
- ❌ NextAuth v4 API (`getServerSession` 등) 사용하지 않기 — v5 `auth()` 함수만 사용
