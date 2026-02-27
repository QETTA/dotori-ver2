# Pending Tasks

## 세션 시작 체크리스트
- [ ] `git pull origin main` (최신 코드)
- [ ] `npm run build` (빌드 확인)
- [ ] `npm test` (테스트 확인)
- [ ] Serena 메모리 확인 (project_overview.md)
- [ ] `docs/STRATEGY_v4.0.md` 전략 문서 참조
- [ ] `docs/` 전체 사업문서 확인 (UX 작업 시 필수)
- [ ] `brand/` 에셋 확인 (UX 작업 시 필수)
- [ ] `tailwind plus/` 템플릿 심층 분석 (UX 작업 시 필수)

## 완료 (R34-R37 — 2026-02-26)
- [x] R34: DS 토큰 마이그레이션 (DS_CARD, DS_PAGE_HEADER, DS_SURFACE, 브랜드 컴포넌트)
- [x] R35: Mock→Real 데이터 7페이지 + 시즌 브리핑 UX
- [x] R36: 카카오 딥링크 + UTM + 챗 시즌 프롬프트 + 브랜드 에셋 배포
- [x] R37: 전자서명 Canvas UI + Home 대시보드 실데이터
- [x] docs/ 사업문서 분석 기반 디자인 방향 → R34에서 토큰 시스템 확립
- [x] brand/ 에셋 활용 → BrandWatermark + BrandEmptyIllustration 전페이지 배포
- [x] Canvas+PDF 자체 서명 UI → SignaturePad.tsx 완성

## 완료 (R33 — 2026-02-26)
- [x] useSyncExternalStore 무한 루프 수정 (RecentFacilities, SavedFilters)
- [x] 탐색 페이지 프리미엄 리디자인
- [x] my·login·settings·waitlist 프리미엄 폴리싱
- [x] 4 신규 페이지 (documents, interests, support, app-info)
- [x] 5 페이지 폴리싱 (notifications, community, community/write, onboarding, chat)
- [x] MongoDB URI 갱신 + DO 프로덕션 동기화
- [x] Serena 메모리 재정립 (agent_task_registry, worktree_pipeline 생성)

## 완료 (R38 — 2026-02-26)
- [x] R38: Data Flow Fixes + E-Signature Flow + SEO (8 에이전트, 2 waves)
  - Home API 핫포스트 작성자 수정 + 동적 시설수
  - Community 상세/글쓰기 mock→real API 연결
  - 에러 페이지 deprecated 클래스 수정
  - 전자서명 6단계 플로우 페이지 + 4 컴포넌트
  - SEO metadata layout 5곳
  - 랜딩 데이터 갱신 + 유보통합 메시징

## 완료 (R39 — 2026-02-26)
- [x] R39: DocumentFormRenderer — 전자서명 폼 동적 렌더러
  - 14종 템플릿 필드 동적 렌더링 (text/date/checkbox/select)
  - use-esignature-flow: documentType + formValues 상태 추가
  - sign/page.tsx: 2섹션 폼 + canProceed 검증 + preview 요약 + 제출 body 확장
  - clauses 단계: 템플릿별 법적 조항 동적 추가

## 완료 (R40 — 2026-02-26)
- [x] R40: DOC_TYPE_LABELS 14종 정합성 + Home 퍼널 동적화
  - DOC_TYPE_LABELS: snake_case 6종 → 한국어 14종 (MongoDB DOCUMENT_TYPES 동기화)
  - DocumentView에 raw documentType 필드 추가 → template lookup 안정화
  - Home 퍼널 스텝: hardcoded 0 → dashboard interestCount/waitlistCount 기반 동적 계산

## 완료 (R41 — 2026-02-26)
- [x] R41: UX/UI 프리미엄 폴리싱 — 4페이지 비주얼 업그레이드
  - community/write: DS_CARD + category pill tap 모션 + 글자수 카운터 + BrandWatermark + FadeInStagger
  - my/support: hoverLift 컨택 카드 + FAQ open accent 배경 + DS_CARD + BrandWatermark
  - my/app-info: spring bounce 아이콘 + HeartIcon pulse + hoverLift 법적링크 + DS_CARD + BrandWatermark
  - sign/page: AnimatePresence 스텝 전환 + DS_CARD.raised + DS_PAGE_HEADER eyebrow + BrandWatermark

## 완료 (R42 — 2026-02-26)
- [x] R42: 랜딩 페이지 대규모 리팩토링
  - 중복 섹션 3개 제거 (Value Props, Stats, Testimonials)
  - 시각 리듬: dark→white→cream→white→dark-panel→forest (6색 교차)
  - Radiant DarkBentoSection: rounded-3xl dark panel + radial gradient glow (요금제)
  - Salient Pricing: featured card white-on-dark 반전 + shadow-xl
  - Studio text-balance/text-pretty 전체 적용
  - ReviewMarquee 버그 수정: fadeBg prop + aria-hidden 전달
  - 502→233줄 (46% 감소)

## 완료 (R43 — 2026-02-27)
- [x] R43: Brand Consistency Pass — BrandWatermark 12/18 + Community DS_CARD polish
  - BrandWatermark 7페이지 추가 (community, waitlist, documents, notifications, interests, settings, login)
  - Community 게시글 카드 DS_CARD.flat + hoverLift, 빈 상태 DS_CARD.flat, 카테고리 칩 tap.chip

## 완료 (R44 — 2026-02-27)
- [x] R44: BrandWatermark 전체 배치 완성 — 18/18 앱 페이지 100%
  - 6페이지 추가 (my, chat, explore, facility/[id], community/[id], onboarding)

## 완료 (R45 — 2026-02-27)
- [x] R45: DS_CARD 토큰 마이그레이션 — inline 패턴 0건 달성
  - 7파일 15건: facility/[id], onboarding, settings, notifications, interests, documents, waitlist
  - bg-dotori-950/[0.025] → DS_CARD.flat.base, dark 값 정규화

## 완료 (R47 — 2026-02-27)
- [x] R47: Error Boundaries + Loading Skeletons + 문서 정합
  - 4개 route group error boundary (app/auth/landing/onboarding)
  - 5개 loading skeleton (home/explore/chat/facility/community)
  - BUSINESS_PLAN.md 수치 갱신 (20 pages, 54 API, 804 tests)
  - CHANGELOG.md v4.0 헤더 + R33~R46 기록 추가
  - 구 문서 2개 아카이브 표기

## 잔여 프론트엔드
- [x] ~~metadata layout 누락 5파일~~ (R38 완료)
- [x] ~~랜딩 수치 20027→20000+~~ (R38 완료)
- [x] ~~root layout.tsx 키워드 추가 2건 (유치원변경, 유치원교체)~~ (R42 확인 — 이미 적용됨)
- [x] ~~BrandWatermark 전체 배치~~ (R43+R44 완료 — 18/18 앱 페이지)
- [x] ~~DS_CARD 토큰 마이그레이션~~ (R45 완료 — inline 0건)
- [x] ~~Error Boundaries + Loading Skeletons~~ (R47 완료)
- [x] ~~투자자 문서 정합~~ (R47 완료)

## v4.0 Phase A: 시설 데이터 확장
- [ ] 유치원알리미 API 키 신청
- [ ] 어린이집정보공개포털 개발계정 심의 신청
- [ ] 전국어린이집표준데이터 Open API 연동 (자동승인)
- [ ] 행정안전부 인구통계 API 연동
- [ ] KOSIS OpenAPI 연동
- [ ] 유치원 8,500개소 데이터 수집 + MongoDB 적재
- [ ] 기존 어린이집 20,027 → 27,387 갱신
- **목표**: MongoDB 35,887 시설

## v4.0 Phase B: TO 예측 엔진
- [ ] TO 예측 모델 설계
- [ ] Layer 1~4 구현
- **블로커**: API 키 심의 기간 (1~2주)

## v4.0 Phase C: 전자서명
- [x] Canvas 서명 컴포넌트 (SignaturePad.tsx — R37 완료)
- [x] 전자서명 6단계 플로우 페이지 (/my/documents/sign — R38 완료)
- [x] 전자서명 하위 컴포넌트 (StepIndicator, LegalClausesPanel, DocumentSelector, SuccessPanel — R38 완료)
- [x] 문서 폼 렌더러 (DocumentFormRenderer — R39 완료)
- [ ] 모두싸인 하이브리드 연동
- **블로커**: 모두싸인 API 계약

## v4.0 Phase D: B2B/B2G
- [ ] 시설 대시보드 MVP
- **블로커**: 지자체 예산 편성 주기
