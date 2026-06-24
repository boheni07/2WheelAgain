# 디자인 (Design System) AGENTS Discipline

## 1. Purpose

Tailwind CSS 기반 UI 규칙. 토큰, 컴포넌트, 레이아웃 패턴.

## 2. Design Tokens

### 2.1 컬러 팔레트

```css
:root {
  /* Primary — 산업용 그린 */
  --color-primary-50:   239 246 244;   /* #eff6f4 */
  --color-primary-300:  140 170 130;   /* #8caa82 */
  --color-primary-500:  45 110 100;    /* #2d6e64 */
  --color-primary-900:  45 60 52;      /* #2d3c34 */

  /* Neutrals */
  --color-neutral-50:   248 250 252;   /* #f8fafc */
  --color-neutral-400:  148 163 184;   /* #94a3b8 */
  --color-neutral-800:  30 41 59;      /* #1e293b */

  /* Status */
  --color-success-500:  22 163 74;     /* #16a34a */
  --color-warning-500:  202 138 4;     /* #ca8a04 */
  --color-danger-500:   220 38 38;     /* #dc2626 */
}
```

### 2.2 타이포그래피

| 스케일 | Tailwind | 용도 |
|--------|---------|------|
| `text-xs` | `0.75rem` | 캡션, 뱃지 |
| `text-sm` | `0.875rem` | 보조 텍스트, 폼 레이블 |
| `text-base` | `1rem` | 본문 |
| `text-xl` | `1.25rem` | 카드 제목 |
| `text-3xl` | `1.875rem` | 히어로 |

## 3. Code Style Rules

### 3.1 레이아웃

- `max-w-4xl mx-auto` 콘텐츠 박스 — hero/full-bleed 제외
- section 간격: `space-y-6`
- grid: `grid-cols-1 md:grid-cols-2 gap-6`

### 3.2 컴포넌트

- Card: `rounded-xl shadow-sm border + Header + Body + Footer`
- Button: `px-4 py-2 rounded-md font-medium transition-colors`
- Badge: `rounded-full px-2 py-0.5 text-xs font-medium`

### 3.3 About 페이지 레이아웃

- Hero: 큰 타이틀 (`text-4xl font-bold`) + 서브 타이틀 (`text-lg`) + 간결 본문 (`text-base`)
- 섹션 구분: 수평선 (`border-t`) + `max-w-3xl mx-auto` 박스
- 비전/미션 영역: 아이콘(emoji) + 제목 + 설명 3열 그리드 (`text-center`)
- CTA: 두 번째 버튼 (`ring` outline 스타일) + 메인 버튼 (`primary` fill)

```tsx
// AboutPage 레이아웃 패턴
<section className="text-center py-16 space-y-4">
  <h1 className="text-4xl font-bold">2WheelAgain</h1>
  <p className="text-lg text-[var(--color-neutral-400)]">
    방치된 자전거가 새로운 여행이 되는 곳
  </p>
</section>

<section className="max-w-3xl mx-auto py-12 space-y-6">
  <h2 className="text-2xl font-semibold">서비스 비전</h2>
  <p className="text-base leading-relaxed">...</p>
</section>
```

### 3.4 Article 페이지 레이아웃

- 목록 (`/blogs`): `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, ArticleCard 컴포넌트
- ArticleCard: coverImage(top) + title + category badge + date + excerpt(2줄 제한)
- 상세(`/blogs/[slug]`): 최대 너비 `max-w-3xl`, 본문 `text-lg leading-relaxed space-y-4`
- 본문 내 heading: `text-xl/3xl font-semibold` → `text-base` 본문 → `text-sm` 부가 설명
- share 버튼: 상세 페이지 우측 상단 또는 본문 하단 고정

### 3.5 Share 버튼 컴포넌트

```tsx
// component/ShareButtons.tsx — Client Component
// URL복사, Twitter(X), KakaoTalk SDK — 3개 버튼
// - 아이콘 기반 (SVG inline) + Tooltip
// - URL복사 시 Toast 알림 (상태: Copied!)
// - KakaoTalk SDK: window.Kakao.init() 호출 전역에서 1회
```

- 버튼 크기: `w-10 h-10 rounded-full` (원형), 간격 `gap-3`
- 색상: Twitter(`bg-[#1DA1F2]`), Kakao(`bg-[#FEE500]`), URL(`bg-[var(--color-neutral-800)]`)
- `ShareButtons`는 `use client` 필요 (클립보드 API 사용)

## 4. Must Do

- `space-y-6` section 간격 표준화
- `max-w-4xl mx-auto` 콘텐츠 박스
- 모든 이미지 alt 속성 필수
- 본문 최소 `text-sm`, `text-xs`는 캡션만

## 5. Must Not Do

- Inline CSS — Tailwind 유틸리티만 사용
- 레이아웃 grid에 12-column 외 임의 flex 사용
