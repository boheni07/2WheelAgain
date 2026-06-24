# 디자인 (UI/UX) AGENTS Discipline

## 1. Purpose

`2WheelAgain` 플랫폼의 디자인 시스템, 컴포넌트 팔레트, 색상/타이포그래피 토큰, 접근성 지침을 정의합니다.
Radix UI + Tailwind CSS를 기반으로 하며, 산업용 그린(industrial green) 테마를 핵심으로 합니다.

## 2. Design Tokens

### 2.1 컬러 팔레트

```css
/* styles/tokens.css */
:root {
  /* Primary & Brand */
  --color-primary-50: 239 246 244;   /* #eff6f4 */
  --color-primary-300: 140 170 130;   /* #8caa82 */
  --color-primary-500: 45 110 100;   /* #2d6e64 */
  --color-primary-700: 45 110 100;   /* #2d6e64 */
  --color-primary-900: 45 60 52;     /* #2d3c34 */

  /* Neutrals (Slate/Gray) */
  --color-neutral-50: 248 250 252;   /* #f8fafc */
  --color-neutral-100: 241 245 249;  /* #f1f5f9 */
  --color-neutral-400: 148 163 184;  /* #94a3b8 */
  --color-neutral-800: 30 41 59;     /* #1e293b */

  /* Status Colors */
  --color-success-500: 22 163 74;    /* #16a34a */
  --color-warning-500: 202 138 4;    /* #ca8a04 */
  --color-danger-500: 220 38 38;     /* #dc2626 */
  --color-info-500: 3 105 161;       /* #0369a1 */

  /* Spacing */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
}
```

### 2.2 타이포그래피

| 스케일 | 폰트 크기 | 라인 높이 | 용도 |
|--------|---------|---------|------|
| `text-xs` | `0.75rem` (12px) | `1rem` | 캡션, 뱃지 텍스트 |
| `text-sm` | `0.875rem` (14px) | `1.25rem` | 보조 텍스트, 폼 레이블 |
| `text-base` | `1rem` (16px) | `1.5rem` | 본문 텍스트 |
| `text-lg` | `1.125rem` (18px) | `1.75rem` | 소제목 |
| `text-xl` | `1.25rem` (20px) | `1.75rem` | 카드 제목 |
| `text-2xl` | `1.5rem` (24px) | `2rem` | 섹션 제목 |
| `text-3xl` | `1.875rem` (30px) | `2.25rem` | 히어로 제목 |

## 3. Directory Structure

```
design/
├── AGENTS.md                    # 이 파일
├── tokens/
│   ├── colors.json              # 컬러 토큰 (JSON)
│   ├── spacing.json             # 간격 토큰
│   └── typography.json          # 타이포그래피 토큰
├── components/
│   ├── Button.tsx               # 디자인 시스템 Button
│   ├── Input.tsx                # Input + Label 조합
│   ├── Card.tsx                 # Card + Header + Body
│   ├── Badge.tsx                # 상태/타입 뱃지
│   ├── EmptyState.tsx           # 콘텐츠 없을 때
│   └── Pagination.tsx           # 페이지네이션
└── assets/
    └── logo.svg                 # 2WheelAgain 로고
```

## 4. Component Guidelines

### 4.1 Button

```tsx
// UI 컴포넌트는 Shadcn/Radix 조합으로 구현
// variants로 size, variant를 스타일링
// 필수 prop: asChild (Radix 호환성)
```

- **Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes**: `default`, `sm`, `lg`, `icon`
- 상태 뱃지의 경우 `variant="secondary"` 또는 `variant="outline"` 권장
- **주의**: `disabled` 상태는 반드시 `opacity-50 cursor-not-allowed` 적용

### 4.2 Badge

```tsx
// 상태별 color 매핑:
// pending -> yellow
// responded -> blue
// scheduled -> teal
// completed -> green
// cancelled -> red
```

### 4.3 EmptyState

```tsx
// 아이콘 + 제목 + 설명 + CTA 버튼 구성
// 아이콘은 Lucide React 사용
```

## 5. Must Do

- ✅ 모든 컴포넌트에 `className` 전파 — `asChild` 패턴 준수
- ✅ Tailwind CSS utility-first 만 사용 — 임의 CSS 파일 금지
- ✅ 색상 코드 고정값 사용 금지 — CSS 변수(`--color-primary-500`) 사용
- ✅ 접근성: 모든 버튼/링크에 `aria-label` 부여
- ✅ 모바일 퍼스트 반응형 — `sm:`, `md:`, `lg:` 브레이크포인트 순서대로 작성
- ✅ 테마 일관성: `primary`, `neutral`, `status` 컬러 외에는 추가 금지

## 6. Must Not Do

- ❌ `!important` 사용 금지
- ❌ 임계값을 위한 `h-[123px]` 같은 임의 Tailwind 값 금지
- ❌ CSS-in-JS 스타일링 금지
- ❌ 시스템 폰트 외의 Google Fonts 사용 금지 (단, 필요시 `font-family` 토큰으로 관리)
- ❌ 디자인 토큰을 CSS 파일에 직접 수정하지 않기 — `tokens/` 폴더에서 관리
