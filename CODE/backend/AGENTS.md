# 백엔드 AGENTS Discipline

## 1. Purpose

Next.js App Router API 라우트 구조, 인증·인가, 데이터 검증, 에러 처리.
API 라우트는 `frontend/src/app/api/` 이하에 배치.

## 2. Directory Structure

```
frontend/src/app/api/
├── auth/
│   ├── [...nextauth]/
│   │   └── route.ts             # nextauth handler
│   └── register/
│       └── route.ts             # POST 회원가입
├── bikes/
│   └── route.ts                 # GET/POST 자전거 목록
├── bikes/
│   └── [id]/
│       └── route.ts             # GET/PUT/DELETE 자전거 상세
├── bookings/
│   ├── route.ts                 # GET/POST 예약 목록
│   └── [id]/
│       ├── route.ts             # GET PATCH/DELETE 예약 상세
│       └── status/
│           └── route.ts         # PATCH 상태 변경
└── admin/
    └── route.ts                 # GET 관리자 전용 데이터
```

## 3. Code Style Rules

### 3.1 API 라우트 구조

- 파일: `app/api/[endpoint]/route.ts`
- 각 handler는 method별 named export (`export async function GET(...)`)
- Zod 스키마로 요청 body 검증

```ts
// app/api/bikes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bikeUpdateSchema } from "@/schemas/bike.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bike = await prisma.bike.findUnique({ where: { id } });
  if (!bike) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bike);
}
```

### 3.2 Articles API 패턴

Articles API는 `/api/articles` (목록/생성) + `/api/articles/[slug]` (상세/수정/삭제) 구조. slug 기반 라우팅.

```ts
// app/api/articles/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { articleCreateSchema } from "@/schemas/article.schema";
import { auth } from "@/lib/auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category");
  const skip = (page - 1) * 20;
  const where: { status: "PUBLISHED"; category?: string } = { status: "PUBLISHED" };
  if (category) where.category = category;
  const [articles, total] = await Promise.all([
    prisma.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip, take: 20 }),
    prisma.article.count({ where }),
  ]);
  return NextResponse.json({ success: true, data: { articles, totalPages: Math.ceil(total / 20) } });
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = articleCreateSchema.parse(body);
  const article = await prisma.article.create({ data: parsed });
  return NextResponse.json({ success: true, data: article }, { status: 201 });
}

// app/api/articles/[slug]/route.ts
export async function GET(_req, { params }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  const body = await req.json();
  const parsed = articleUpdateSchema.parse(body);
  const article = await prisma.article.update({ where: { slug }, data: parsed });
  return NextResponse.json({ success: true, data: article });
}

export async function DELETE(_req, { params }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  await prisma.article.delete({ where: { slug } });
  return NextResponse.json({ success: true, data: null });
}
```

### 3.2 표준 응답 포맷

- 성공: `{ success: true, data: T }`
- 에러: `{ success: false, error: string }`
- HTTP status 코드는 상황에 맞게 변경

### 3.3 인증 요구

- 모든 API 라우트는 `auth()` 호출 후 session 검증
- admin 전용: `session.user.role !== "ADMIN"` → `403` 응답

## 4. Must Do

- API 라우트는 `app/api/[route]/route.ts` — method별 named export
- Zod 스키마로 body 검증 (스키마는 `frontend/src/schemas/` 배치)
- `auth()` 호출 후 session 검증 — 미인증 요청은 `401`
- 에러 응답은 `{ success: false, error: string }` 포맷
- Article slug는 고유 — DB unique 제약 + Zod `min(1)` 검증

### 4.1 Article Zod 스키마

```ts
// schemas/article.schema.ts
import { z } from "zod";

export const articleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(300),
  content: z.string(),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  category: z.enum(["repair", "story", "notice"]).default("repair"),
  publishedAt: z.string().datetime().optional(),
});

export const articleUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  category: z.enum(["repair", "story", "notice"]).optional(),
  publishedAt: z.string().datetime().optional(),
});
```

- slug는 `articleCreateSchema`에서 항상 필수
- slug는 영문 소문자+숫자+하이픈만 허용 (SEO friendly)
- `publishedAt`은 PUBLISHED 상태일 때만 설정
- 제목 변경 시 slug도 함께 변경 가능 (old slug로 DELETE 후 새 slug INSERT)

## 5. Must Not Do

- `as any` 타입 단언 — Prisma 타입 완전 사용
- 미인증 API 엔드포인트 직접 호출 — middleware/rbac 반드시 경유
- API 라우트에서 `use client` — 서버 코드이므로 불필요
