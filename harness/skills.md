# Harness — Skills Configuration

> 2WheelAgain V2에서 사용하는 스킬 목록 및 구성.

---

## 1. Built-in Skills

| 스킬 | 설명 | 적용 파일 | 명령어 |
|------|------|-----------|--------|
| `frontend-ui-ux` | Tailwind CSS + Radix UI 기반 UI/UX 구현 전문가 | `CODE/design/AGENTS.md`, `CODE/frontend/AGENTS.md` | `/frontend-ui-ux` |
| `git-master` | 원자 커밋, rebase/squash, 히스토리 검색 | `AGENTS.md` (루트) | `/git-master` |
| `playwright` | 브라우저 자동화 및 E2E 테스트 | `CODE/testing/AGENTS.md` | `/playwright` |
| `review-work` | 구현 후 리뷰 오케스트레이터 (5개 병렬 백그라운드 서브에이전트) | `AGENTS.md` (루트) | `/review-work` |

---

## 2. 스킬 선택 가이드

| 작업 유형 | 권장 스킬 |
|-----------|-----------|
| Tailwind/Radix UI 컴포넌트 구현 | `frontend-ui-ux` |
| Git 커밋/리베이스/변경사항 정리 | `git-master` |
| E2E 테스트/브라우저 자동화 | `playwright` |
| 구현 품질 검토 (후방 검증) | `review-work` |
| 코드 품질 개선/AI slop 제거 | `ai-slop-remover` |

---

## 3. 스킬 로딩 규칙

1. 작업 시작 전 관련 스킬 확인 및 로딩
2. `load_skills=[]` — 스킬이 필요 없는 경우 (드문 경우)
3. `load_skills=["frontend-ui-ux", "git-master"]` — 여러 스킬 복합 사용 가능
4. 스킬 로딩은 task() 또는 skill() 도구로 수행
