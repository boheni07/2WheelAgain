# 프론트엔드 AGENTS Discipline

## 1. Purpose

`frontend/src/` 내 모든 Next.js 15 App Router 코드에 적용되는 규칙.

## 2. Directory Structure

```
frontend/src/
├── app/                       # App Router 루트
│   ├── layout.tsx             # 최상위 레이아웃 (Inter 폰트, SessionProvider)
│   ├── page.tsx               # / — 메인 페이지
│   ├── globals.css            # Tailwind + 커스텀 design tokens
│   ├── login/page.tsx         # /login — 네이버/카카오톡 SNS 로그인 버튼만 (회원가입 폼 없음)
├── hooks/                     # 커스텀 훅 (현재 비어 있음)
├── lib/
│   ├── auth.ts                # NextAuth v5 config (Naver + KakaoTalk providers)
│   └── utils.ts               # 공통 유틸리티
├── types/                     # 전역 타입 (현재 비어 있음)
├── schemas/                   # Zod 스키마
│   ├── bike.schema.ts
│   ├── booking.schema.ts
│   └── article.schema.ts
└── components/                # 재사용 컴포넌트
```

## 3. Code Style Rules

### 3.1 Server / Client 분리

- **기본은 Server Component** — `app/` 폴더의 페이지/레이아웃은 `use client` 없이 작성
- **Client 함수만 `'use client'`** — 폼 처리, 상태 관리, 이벤트 리스닝이 필요한 파일에만 추가
- **Server Components**는 async `params` 패턴 지원 (Next.js 15):

```tsx
export default async function BikeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bike = await getBike(id);
  return <BikeDetail bike={bike} />;
}
```

### 3.2 CSS / Tailwind

- `globals.css`: `--primary: #2d5a3d`, `--accent: #c4935e`, `--bg: #fafaf8`
- `@import "tailwindcss"` + `:root` 커스텀 토큰만 포함
- 컴포넌트 내부에는 `bg-[var(--primary)]` 등 var 사용 금지 — 네임드 클래스 사용

### 3.3 데이터 페칭

- Server Component에서 Prisma 직접 쿼리 — API 라우트 경유 불필요 (단, 상태 변경은 예외)

```tsx
// articles 목록 Server Component
export default async function BlogsPage() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });
  return <ArticleGrid articles={articles} />;
}
```

### 3.4 OG Metadata (Next.js 15 `generateMetadata`)

- `/about`와 `/blogs/[slug]`는 `generateMetadata()`로 OG title/description/image 설정
- article 상세 페이지는 `article.title/excerpt/coverImage`를 OG 메타에 주입
- favicon과 기본 OG 이미지는 최상위 `layout.tsx`에서 설정

```tsx
// blogs/[slug]/page.tsx — metadata export
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/articles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.excerpt ?? "",
    openGraph: {
      title: article.title,
      description: article.excerpt ?? "",
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}
```

## 4. Must Do

- 페이지는 기본 Server Component — `use client` 디렉티브 없애고 작성
- `globals.css`에 토큰 정의, 컴포넌트에서는 Tailwind 네임드 클래스만
- 404 커스텀 페이지 유지
- 새로운 컴포넌트는 `src/components/` 하위에 배치
- **로그인 페이지**: `/login` — `next/auth`: `signIn("naver")`, `signIn("kakao")` 버튼만
- **회원가입 API/폼 없음** — OAuth callback에서 `User.findOrCreate()` 자동 생성
- `ArticleGrid`/`ArticleCard` 컴포넌트는 Server Component로 작성

## 5. Must Not Do

- `use client` 붙인 페이지에서 `fetch`/Prisma — 서버 전용
- CSS-in-JS (emotion, styled-components) — Tailwind만
- `globals.css`에 Tailwind 유틸리티 클래스 직접 작성
- `/register` 페이지 또는 email/password 회원가입 폼 — SNS OAuth 전용
- 클라이언트에서 JWT 수동 관리 — 오직 `next-auth` `auth()`/`getSession()`만
