# Product Requirements Document — 2WheelAgain

## 자전거 업싸이클링 / 리싸이클링 판매 · 나눔 플랫폼

---

## 1. 개요 (Overview)

### 1.1 프로젝트 명
**2WheelAgain** — 다시 두 바퀴가 움직이게

### 1.2 배경 및 목적
버려지는 자전거가 사회 문제가 되고 있습니다.
사용하지 않는 자전거가 판매 · 나눔을 통해 누군가에게 다시 의미를 갖도록,
**중간 단계까지 연결하는 플랫폼**을 구축합니다.

온라인 결제 및 복잡한 커머스 기능은 **2단계** 우선,
1단계에서는 **기초적인 매칭 · 예약 · 소통 기능**에 집중합니다.

### 1.3 목표 KPI (1차 출시 기준)

| 지표 | 목표값 | 비고 |
|------|--------|------|
| 등록 자전거 수 | 500건 / 월 | BikeRun 등록 |
| 문의 · 예약 전환율 | 15% 이상 | 시민 문의 |
| 평균 응답 · 처리 시간 | 48시간 이내 | BikeRun 매칭 |
| 분반모율 | 5% 미만 | 미매칭 |

---

## 2. 대상 사용자 (Target Users)

### 2.1 시스템 구성 및 역할

| 역할 | 대상 | 설명 |
|------|------|------|
| **B (BikeRun 관리자)** | BikeRun (사회적기업) | 자전거 등록 · 수리 · 판매/나눔 게시 · 매칭 · 운영 관리자 |
| **U (일반 시민)** | 누구나 | 자전거 구매 또는 나눔 신청 · 예약 · 체결 |

> **핵심 원칙**: 자전거 등록 · 수리 · 판매/나눔 게시는 오직 **BikeRun 관리자**만 수행합니다.
> 일반 시민은 등록이 불가능하며, 목록 확인 · 문의 · 예약 · 체결만 가능합니다.

### 2.2 주요 페르소나

| 페르소나 | 설명 | 니즈 |
|----------|------|------|
| **U1 — 구매자 시민** | 저예산으로 좋은 자전거 찾는 일반 시민 | 신뢰할 수 있는 물품 정보, 손쉬운 구매 문의 |
| **U2 — 나눔 대상자** | 저비용 · 무료 자전거가 필요한 시민 | 나눔 물품 발견, 신청 · 접수 과정의 단순함 |
| **B1 — BikeRun 관리자** | BikeRun 운영진 — 수리 · 등록 · 매칭 담당 | 자전거 상태 파악 → 등록 →市民 문의 관리 · 매칭 일관화 |

---

## 3. 서비스 구조 (Information Architecture)

```
┌──────────────────────────────────────────────┐
│                    Navigation                 │
├─────────┬──────────┬──────────┬──────────────┤
│  홈      │  자전거  │  내      │  마이페이지  │
│          │  목록   │  작업    │              │
├─────────┴──────────┴──────────┴──────────────┤
│                                              │
│  ┌────────────────────────────────────┐      │
│  │           Main Content             │      │
│  │                                    │      │
│  └────────────────────────────────────┘      │
│                                              │
└──────────────────────────────────────────────┘
```

### 3.1 주요 페이지

| 페이지 | URL 경로 | 접근 | 설명 |
|--------|----------|------|------|
| 홈 (Platform 소개) | `/` | 모든 사용자 | 브랜드 스토리, 서비스 flow, 대표 자전거 소개 (히어로) |
| 자전거 목록 | `/bikes` / `/bikes/list` | 모든 사용자 | 필터 · 검색 · 카드 목록 |
| 자전거 상세 | `/bikes/:id` | 모든 사용자 | 사진, 정보, 문의 / 신청 버튼 |
| **서비스 소개 (About)** | `/about` | 모든 사용자 | 2WheelAgain 서비스 취지, 운영 체계, BikeRun 소개, 수리·나눔·판매 과정 설명 |
| **수리 이야기 (Blog)** | `/blog` | 모든 사용자 | 방치자전거 수리 스토리 목록, 카테고리/태그 필터 |
| **수리 이야기 상세** | `/blog/:slug` | 모든 사용자 | 수리 스토리 상세 (이미지, 수리 전/후, 공유) |
| 자전거 등록 | `/admin/bikes/new` | **BikeRun 관리자만** | 단계별 등록 폼 (수리/상태 기반) |
| 자전거 관리 | `/admin/bikes` | **BikeRun 관리자만** | 등록 목록 · 수리 상태 · 수리/상태 · 게시/비활성화 |
| 판매 문의 | `/bikes/:id/inquire` | 모든 사용자 | 구매 문의 폼 |
| 나눔 신청 | `/bikes/:id/donate-apply` | 모든 사용자 | 나눔 신청 폼 |
| 예약 확인 | `/bookings` | 모든 사용자 | 내 예약 목록 |
| 예약 상세 | `/bookings/:id` | 모든 사용자 | 상태, 연락처, 매칭 진행 상황 |
| 완료 페이지 | `/complete` / `/bookings/:id/complete` | 모든 사용자 | 체결 완료, 후기 작성 |
| 마이페이지 | `/profile` | 모든 사용자 | 내 정보, 문의/예약 이력 |
| 로그인 / 가입 | `/login` | 모든 사용자 | SNS 기반 OAuth 로그인/가입 (네이버·카카오톡). Credentials(이메일/비밀번호) 지원하지 않음. OAuth 인증 완료 시 자동 가입, role은 ADMIN으로 한정 할당 |
| 관리자 대시보드 | `/admin/` | **BikeRun 관리자만** | 등록 · 수리 · 매칭 · 통계 |

---

## 4. 상세 기능 명세 (Feature Specification)

---

### F1. 플랫폼 소개 페이지 (Landing)

**목적**: 방문자가 서비스 취지, 사용 방법, 신뢰도를 빠르게 이해

| 항목 | 내용 |
|------|------|
| 히어로 섹션 | 타이틀 "다시 두 바퀴가 움직이게" + CTA 버튼 [자전거 구경하기] [나눔 알아보기] |
| 서비스 흐름 | 1. BikeRun 수리·게시 → 2.市民 문의 → 3. 직접 전달 → 4. 완료 (4단계 시각화) |
| 대표 물품 카드 | 현재 등록된 인기 자전거 3~6개 미리보기 |
| 통계 배너 | "지금까지 1,234대의 자전거가 다시 움직이고 있습니다" |
| FAQ 섹션 | 구매 방법, 전달 방식, 안전 수칙 |
| CTA 버튼 | 구매자는 [자전거 구경하기], 나눔 대상자는 [나눔 알아보기] |
| 푸터 | 회사 정보, 이용약관, 개인정보처리방침, 연락처 |

---

### F2. 자전거 등록 · 관리 (BikeRun Admin — 자전거 게시)

**목적**: BikeRun 관리자가 수리된 자전거를 판매 또는 나눔용으로 등록 · 관리

> **접근 제한: BikeRun 관리자만 접근 가능**

#### 4.2.1 단계별 폼 구성 (등록)

**Step 1 — 기본 정보**

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 자전거 종류 | radio | 예 | 도로, 산악, 접이식, 전기방식, 아이스카트, 그외 |
| Brand / 제조사 | text | 선택 | 예: 위아, 세븐기어, 스펙타, 무표기 |
| 모델명 | text | 선택 | — |
| 프레임 크기 | text | 선택 | 예: 15", S, M, L, 성인용, 어린이용 |
| 연식 | select | 선택 | 예: 2024, 2023, 2022, 2020~2021, 모름 |

**Step 2 — 상태 및 가격**

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 등록 Purpose | radio | 예 | 판매 / 나눔 |
| 상태 | select | 예 | 새상품 / 매우 양호 / 양호 / 사용감 있음 / 수리필요 |
| 판매가 (원) | number | 조건 | Purpose='판매'일 때 필수 |
| 후원금 (나눔용) | number | 조건 | Purpose='나눔'일 때: 금액 설정 (선택) |
| 거래 가능 지역 | checkbox | 예 | 3개까지 (ex: 강남, 마포, 분당) |

**Step 3 — 사진 및 설명**

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 대표 사진 | upload | 예 | 최대 1장, 자동 1순위 |
| 추가 사진 | upload | 아니요 | 최대 5장, JPG/PNG, 1장당 5MB |
| 특징 (自由記述) | textarea | 예 | 최대 1,000자 |
| 단점 / 리크 | textarea | 예 | 최대 500자 (정직성 확보) |

**Step 4 — 수리 이력**

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 수리 내용 | textarea | 아니요 | 수리된 부품, 작업 요약 |
| 수리 담당자 | text | 아니요 | BikeRun 내부 담당자 이름 |
| 수리일 | date | 아니요 | 작업 날짜 |

#### 4.2.2 자전거 관리 대시보드 (/admin/bikes)

| 기능 | 설명 |
|------|------|
| 등록 목록 | 카드 테이블 - 상태, 가격, Purpose, 등록일 |
| 게시/비활성화 | 상태 전환 (active ↔ archived) |
| 상세 보기 | 등록 정보 전체 + 문의/예약 이력 |


---

### F3. 자전거 목록 (Browse)

**목적**: 원하는 조건에 맞는 자전거 탐색

| 항목 | 내용 |
|------|------|
| 검색 | 자전거명, 브랜드, 위치 키워드 검색 |
| 필터 | 종류, 상태, 가격대, 거래 목적 (판매 / 나눔 / 전체), 지역 |
| 정렬 | 등록일 · 최신, 가격 오름 / 내림, 인기순 |
| 목록 형태 | 카드 그리드 (1행 3~4개, 반응형) |
| 카드 정보 | 대표 사진, Brand, 종류, 가격 / 나눔, 지역, 등록일 |

---

### F4. 자전거 상세 (Detail)

| 항목 | 내용 |
|------|------|
| 이미지 갤러리 | 스와이프 + 썸네일 |
| 기본 정보 | 표 형태로 정리 |
| 상태 및 설명 | 텍스트 + 단점 / 리크 강조 |
| 수리 이력 | 수리 내용, 담당자, 수리일 (BikeRun 관리 정보) |
| 게시 기관 | "BikeRun(사회적기업)에서 수리 · 게시한 물품" 배지 |
| CTA 버튼 | Purpose에 따라 [판매 문의하기] / [나눔 신청하기] |
| 같은 지역 물품 | 하단에 관련 물품 3건 추천 |

---

### F5. 판매 문의 / 나눔 신청 (Inquire & Donor)

#### 4.5.1 판매 문의

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 이름 | text | 예 | — |
| 연락처 (전화) | phone | 예 | — |
| 이메일 | email | 아니요 | — |
| 문의 내용 | textarea | 예 | 최대 2,000자, 기본 문구 포함 |
| 방문 희망 시간대 | select | 아니요 | 평일 야간, 주말 오전, 주말 오후 |

#### 4.5.2 나눔 신청

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 이름 | text | 예 | — |
| 연락처 (전화) | phone | 예 | — |
| 이메일 | email | 아니요 | — |
| 신청理由 | textarea | 예 | 최대 1,000자 |
| 기대 전달 시기 | select | 아니요 | 1주일 이내, 2주 이내, 유연 |

---

### F6. 예약 · 매칭 관리 (Booking)

**목적**: 문의 · 신청 이후의 직접 접촉 및 전달 배정

| 상태 | 설명 |
|------|------|
| `pending` | 문의 / 신청 접수 완료, BikeRun 확인 대기 |
| `responded` | BikeRun 응답 완료, 연락 교환 중 |
| `scheduled` | 전달 일시 · 장소 확정 |
| `completed` | 실제 전달 완료, 양측 확인 |
| `cancelled` | 취소됨 |

**예약 상세 화면 구성**

| 영역 | 내용 |
|------|------|
| 현재 상태 | 뱃지로 표시 (예: "BikeRun 확인 대기 중") |
| 상대방 연락처 | 상태 전이 시 자동 공개 (responded 이후) |
| 전달 메모 | 날짜 · 장소 · 메모 작성 |
| 상태 변경 | BikeRun이 진행 / 시민은 확인 (BikeRun: pending → responded → scheduled / 시민: scheduled → completed) |
| 취소 | 상태가 completed 이전에 한해 취소 가능 |

---

### F7. 완료 페이지 (Completion)

| 요소 | 내용 |
|------|------|
| 축하 메시지 | "자전거가 다시 움직입니다! 🎉" |
| 매칭 요약 | 등록 자전거명, 거래 유형, 가격, 날짜 |
| 후기 작성 (optional) | 1~5 별 +的自由記述 (최대 500자) |
| 후기 공개 여부 | 공개 / 비공개 선택 |
| CTA | [내 예약 목록으로] [자전거 구경하기] |

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

| 항목 | 요구사항 |
|------|----------|
| **성능** | 페이지 LCP ≤ 2.5초, FID ≤ 100ms |
| **반응형** | Desktop ≥ 1024px, Tablet ≥ 768px, Mobile ≥ 375px |
| **접근성** | WCAG 2.1 AA 준수도 목표 |
| **데이터 보존** | 등록 정보 최대 2년 보관 (휴면 후 자동 삭제) |
| **콘텐츠 제한** | 사진 1장당 5MB, 총 6장 |
| **보안** | HTTPS 기본, 연락처는 상태 전이 시까지만 공개 |

---

## 6. 데이터 모델 (Data Model — Draft)

```
User
├── id (UUID)
├── email (string, unique)
├── password_hash (string)
├── nickname (string)
├── phone (string)
├── created_at (datetime)
└── role (enum: citizen, bikrun_admin)

Bike
├── id (UUID)
├── source (string, nullable) — 수리 들어온 경로 (기부/수거 등)
├── repair_notes (string, nullable) — 수리 내용 요약
├── type (enum: road, mtb, folding, electric, childcart, other)
├── brand (string, nullable)
├── model (string, nullable)
├── frame_size (string, nullable)
├── year (enum, nullable)
├── purpose (enum: sale, donate)
├── condition (enum: like_new, very_good, good, fair, needs_repair)
├── price (int, nullable — purpose=sale)
├── donate_type (enum: free, donation, rental — purpose=donate)
├── regions (string[]) — 거래 희망 지역
├── photos (JSON) — [{ url, order }]
├── description (string)
├── drawbacks (string)
├── contact_info (JSON) — BikeRun 시스템 연락처 { kakao_id, phone, email }
├── status (enum: active, archived, removed)
├── reported_count (int)
├── created_at (datetime)
└── updated_at (datetime)

Inquiry
├── id (UUID)
├── bike_id (UUID → Bike)
├── inquirer_id (UUID → User)
├── inquirer_name (string)
├── inquirer_phone (string)
├── inquirer_email (string, nullable)
├── message (string)
├── preferred_time (string, nullable)
├── status (enum: pending, responded, scheduled, completed, cancelled)
├── responder_note (string, nullable)
├── meeting_place (string, nullable)
├── meeting_date (datetime, nullable)
├── created_at (datetime)
└── updated_at (datetime)

Review (후기)
├── id (UUID)
├── inquiry_id (UUID → Inquiry)
├── giver_id (UUID → User)
├── receiver_id (UUID → User)
├── bike_id (UUID → Bike)
├── rating (int, 1–5)
├── content (string, nullable)
├── is_public (boolean)
├── created_at (datetime)
└── updated_at (datetime)
```

---

## 7. UI / UX 방향 (Aesthetic Direction)

### 7.1 컨셉

> **Industrial Green**
> 업싸이클링의 "재탄생"을 시각화: 재활용의 녹색 + 메탈/강철의 산업적 느낌

### 7.2 시각 방향

| 요소 | 방향 |
|------|------|
| 톤 | 자연 그린 + 차콜/그레이 |
| 서체 |_Display: 고디딕글씨 또는 유사 (장인 느낌) / Body: 가독성 좋은 고딕_ |
| 사진 | 자연광, 빈 배경, 물품의 실제 모습 (과도한 보정 X) |
| 애니메이션 | 리스트 스크롤 시 stagger reveal, 버튼 hover에서 미세 scale |
| 공간 | 여백 다용 — 카드 한 장 한 장을 강조 |

### 7.3 주요 인터랙션

- **등록 Flow**: 4-step progress bar → 한 번에 직관적
- **상태 뱃지**: 상태별 색상 코드 (pending=amber, matched=blue, completed=green)
- **문의 CTA**: 고정된 하단 버튼 (모바일) — 스크롤해도 항상 접근 가능

---

## 8. 향후 확장 로드맵 (Roadmap — V2)

| Phase | 예상 시기 | 주요 기능 |
|-------|-----------|-----------|
| **V1** | M1–M3 | 본 PRD 내의 모든 기능 |
| **V2** | M4–M6 | 방치자전거 신고(GPS 기반 위치정보), 방치자전거 수거(지방자치단체-법적처리기준준수), 온라인 결제, 카카오톡 알림, 추천 알고리즘 |
| **V3** | M7–M9 | 기능 안정화, AI 기능을 통한 고품질 서비스 강화 |

---

## 9. 리스크 & 미해결议题

| # |议题 | 영향도 | 대응 방향 |
|---|------|--------|-----------|
| R1 | 실제 전달 안전성 | 높음 | 만남 장소는 공공장소 권장, 앱 내 안전 가이드 |
| R2 | 허위 등록 / 사기 | 높음 | 신고 기능, 후기 시스템, 이상 패턴 모니터링 |
| R3 | 연락처 노출 | 중 | 상태 전이 시까지만 공개, 닉네임 기반 통신 |
| R4 | 물품 설명과 실물 차이 | 중 | 후기 공개 + 리크 의무 기재로 방지 |
| R5 | 데이터 삭제 요청 | 낮음 | GDPR-style 탈퇴 + 데이터 삭제 처리 |

---

## 10. 승인 사항 (Approval)

| 항목 | 이름 | 역할 | 날짜 |
|------|------|------|------|
| Product | — | PM | |
| Design | — | Designer | |
| Engineering | — | Eng Lead | |

---

*이 문서는 1차 스프린트를 위해 작성되었습니다. 각 스프린트마다 업데이트됩니다.*
*Last updated: 2026-06-24*
