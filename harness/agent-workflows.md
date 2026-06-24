# Harness Engineering — 에이전트 워크플로우

> `2WheelAgain` — 멀티 에이전트 협업, 디시플린, 검증
> 본 문서는 설계 전용입니다. 코드 생성을 포함하지 않습니다.

---

## 1. 개요

`2WheelAgain`의 에이전트 워크플로우는 **구조화된 오케스트레이션**을 강제합니다. 어떤 에이전트도 고립되어 작업하지 않습니다. 모든 변경사항은 검토, 테스트, 검증을 거친 후 병합됩니다.

### 1.1 에이전트 역할

| 역할 | 책임 | 범위 |
|------|------|------|
| **Builder** | `CODE/*/AGENTS.md` 준수 코드 구현 | 단일 파일 또는 관련 파일 |
| **Oracle** | 복잡한 변경사항에 대한 아키텍처 리뷰 | 다중 모듈, 인증, 데이터베이스 |
| **Metis** | 사전 기획 분석 | 모호한/복잡한 범위 |
| **Momus** | 코드 검토 검증 | 구현 후 |
| **Explorer** | 코드베이스 탐색 | 익숙하지 않은 모듈, 패턴 |
| **Librarian** | 외부 레퍼런스 조사 | 프레임워크 API, 모범 사례 |

### 1.2 워크플로우 상태

```
REQUEST → PLANNING → CODING → REVIEW → TEST → MERGE
                      ↑        ↓
                      └── REJECT ←──────┘
```

---

## 2. 단일 에이전트 워크플로우 (간단한 작업)

단순한 변경사항 (단일 파일, 기존 패턴) 에 적용:

```
1. Explorer: 기존 패턴 발견 (필요 시)
2. Builder: 변경사항 구현
3. Builder: 자체 검증 (lint + typecheck)
4. 완료
```

### 2.1 단순 작업 예시

| 작업 | 에이전트 | 검증 |
|------|---------|------|
| README 오타 수정 | Builder | 없음 |
| 기존 컴포넌트에 CSS 클래스 추가 | Builder | `lsp_diagnostics` |
| Prisma enum 값 업데이트 | Builder | TypeScript 컴파일러 |

### 2.2 단순 작업 제약사항

- **최대 1개 파일** (또는 관련 형제 파일, 예: `page.tsx` + `layout.tsx`)
- **새로운 의존성/패키지 없음**
- **스키마 변경 없음**
- **인증/RBAC 수정 없음**

---

## 3. 멀티 에이전트 워크플로우 (복잡한 작업)

비단순한 변경사항 (2개 이상 모듈,新功能 기능, 설계 결정) 에 적용:

```
1. Metis: 범위 분석, 모호성 식별
2. Builder: 구현 계획 수립
3. Momus: 계획의 완전성 검토
4. Explorer: 기존 패턴 탐색 (병렬)
5. Librarian: 외부 API 조사 (병렬)
6. Builder: 계획에 따라 구현
7. Oracle: 아키텍처 검토
8. Momus: 코드 정확성 검토
9. Builder: 테스트 통과 검증
10. 완료 — 커밋 + PR
```

### 3.1 탐색 단계

**Explorer** 가 패턴 탐색을 위해 병렬로 실행됨:

| 쿼리 | 대상 |
|------|------|
| "Find auth middleware pattern" | `src/middleware.ts`, `src/app/*/layout.tsx` |
| "Find Zod schema patterns" | `src/schemas/` |
| "Find admin table rendering" | `src/app/admin/` + 컴포넌트 |

### 3.2 조사 단계

**Librarian** 가 외부 레퍼런스 조사를 위해 병렬로 실행됨:

| 쿼리 | 대상 |
|------|------|
| "NextAuth v5 SNS OAuth best practices" | NextAuth 공식 문서 |
| "Prisma N+1 query prevention" | Prisma 성능 문서 |
| "Radix UI accessible dialog patterns" | Radix UI 컴포넌트 예제 |

---

## 4. 검토 및 검증

### 4.1 Moment (Momus) 검토

모든 구현 후 Momus 가 다음을 검증함:

1. **RBAC 준수**: `middleware.ts` + layout 체크
2. **Zod 검증**: 모든 API 라우트에 Zod 스키마 적용
3. **타입 안전성**: `as any` / `@ts-ignore` 없음
4. **에러 처리**: 모든 catch 블록에 적절한 에러 반환
5. **서버/클라이언트 분리**: `"use client"` 필요한 곳에만 사용

### 4.2 Oracle 아키텍처 검토

복잡한 변경사항에 대해 Oracle 가 다음을 검토함:

1. **쿼리 효율성**: N+1 문제 없음
2. **API 라우트 구조**: RESTful 패턴 준수
3. **상태 전이**: Booking 상태 기계 무결성
4. **보안**: RBAC 흐름, 인증 격리

---

## 5. 병렬 실행 규칙

- **Explorer + Librarian**: 항상 병렬 (비동기 `run_in_background=true`)
- **Oracle + Momus**: 순차적 (Oracle → Momus)
- **동일 쿼리의 중복 금지**: Explorer/Librarian 에게 위임한 검색은 본인도 직접 수행 금지
- **결과 수집**: 모든 Oracle/Momus 결과는 최종 답변 전 수집 필수

---

## 6. 에이전트 호출 예시

```typescript
// 복잡한 기능 구현 — 멀티 에이전트 흐름
task(subagent_type="metis", run_in_background=true, load_skills=[], description="Scope analysis")
task(subagent_type="explorer", run_in_background=true, load_skills=[], description="Find auth patterns")
task(subagent_type="librarian", run_in_background=true, load_skills=[], description="Find OAuth best practices")

// 구현 후 검토
const builderResult = task(task_id="{builder_task_id}", ..., description="Implement feature")
task(subagent_type="oracle", run_in_background=true, load_skills=[], description="Architecture review")
task(subagent_type="momus", run_in_background=true, load_skills=[], description="Code correctness review")

// 결과 수집 (system-reminder 대기 후)
background_output(task_id="{oracle_task_id}")
background_output(task_id="{momus_task_id}")
```

---

## 7. 실패 복구

- **3회 연속 실패 시**: 변경사항 되돌리기 → Oracle 에 컨설팅 요청 → 사용자 문의
- **테스트 실패 시**: 테스트 삭제 금지 — root cause 수정 필수
- **리뷰 거부 시**: Momus/Oracle 의 피드백 반영 후 재검토 요청
