# Project Overview — Dotori V2

## v2 현황 (2026-02-27, R47 완료)
- **Next.js 16.1** + React 19 + TypeScript 5.8 strict
- **20 pages**, 0 TS errors, **804 tests** (vitest, 70 test files)
- **54 API routes**, 21 MongoDB models, 139 컴포넌트
- MongoDB Atlas: **20,027 시설** (17개 시도, 어린이집+유치원)
- 배포: DigitalOcean App Platform, sgp 리전, 수동 전용
- 파이프라인 v7: codex-wave.sh + haiku QA 위임
- BrandWatermark: **18/18 앱 페이지 100%** (R43+R44 완성)
- DS_CARD 토큰: **100%** (bg-dotori-950/[0.025] inline 패턴 0건)
- Error Boundaries: **4개 route group** (app/auth/landing/onboarding) + 글로벌 fallback
- Loading Skeletons: **5개** (home/explore/chat/facility/community)
- 완료 라운드: R1~R3(36) → R5(11) → R8(11) → R9(11) → R11(6) → R12(5) → R13(11) → R17(11) → R22(11) → R32~R47 = 159+ 에이전트

## v4.0 전략 (상세: `docs/STRATEGY_v4.0.md`)
- **유보통합 선제 대응**: 어린이집+유치원 통합 검색·TO예측·전자서명
- **목표**: 35,887 시설 (어린이집 27,387 + 유치원 8,500), 현재 20,027
- **핵심**: 5개 공공API + TO예측엔진 + 전자서명 7종 = 풀퍼널 매칭 플랫폼
- **수익**: B2C CPA → B2B SaaS (44K~132K/월) → B2B2B → B2G 지자체
- **태스크**: `.serena/memories/pending_tasks.md` Phase A~D 참조

## 구조
```
dotori-ver2/
├── dotori-app/          ★ Next.js 메인 앱
│   ├── src/app/         App Router (pages + API routes)
│   ├── src/components/  공유 컴포넌트
│   ├── src/lib/         유틸리티, DB, API 클라이언트
│   ├── src/models/      Mongoose 모델 (21개)
│   └── src/types/       TypeScript 타입 정의
├── brand/               브랜드 디자인 가이드 (SVG는 dotori-app/public/brand/)
├── docs/                사양서 (STRATEGY_v4.0.md 등 5개)
├── tailwind plus/       11개 프리미엄 템플릿 (135MB)
└── .serena/             Serena 메모리
```

## 핵심 데이터 흐름
```
CPMS(원장입력) → 정보공개포털/유치원알리미/표준데이터(공개) → 도토리(수집+통합+예측+서명)
```

## R34-R37 변경사항 (2026-02-26)
- **R34**: DS 토큰 마이그레이션 — DS_CARD, DS_PAGE_HEADER, DS_SURFACE, BrandWatermark, BrandEmptyIllustration
- **R35**: Mock→Real 데이터 7페이지 — useNotifications, useWaitlist, useInterests, useDocuments, useCommunityPosts + 시즌 브리핑 UX
- **R36**: 카카오 딥링크 + UTM + 챗 시즌 프롬프트 + 브랜드 에셋 배포 (empty states)
- **R37**: 전자서명 Canvas UI (SignaturePad/SignaturePreview) + Home 대시보드 실데이터 (useHomeDashboard → /api/home)
- 신규 훅 7개: use-home-dashboard, use-notifications(rewrite), use-waitlist(rewrite), use-interests, use-documents, use-utm-tracking
- 신규 컴포넌트 8개: SeasonalBriefing, KakaoChannelButton, ShareButton, UTMTracker, SignaturePad, SignaturePreview + esignature/index
- 신규 유틸 4개: seasonal-config.ts, utm.ts, deep-link.ts, keyword-registry.ts
- API 변경: GET /api/users/me/interests (신규 엔드포인트)

## R38 변경사항 (2026-02-26)
- **Home API**: Post.populate("authorId") 추가 (핫포스트 작성자 "익명" 버그 수정), Facility.estimatedDocumentCount() 동적 시설수
- **Community 상세**: mockPost/mockComments 제거 → useCommunityDetail + useComments 실API 연결, 좋아요 토글, 댓글 작성
- **Community 글쓰기**: POST /api/community/posts 연결, 카테고리 매핑, 로딩/에러 상태
- **에러 페이지**: text-body/text-h2 deprecated → text-lg/text-sm 시맨틱, digest 코드 표시
- **전자서명 플로우**: /my/documents/sign 6단계 위저드 (select→form→clauses→sign→preview→submit)
- **전자서명 컴포넌트**: StepIndicator, LegalClausesPanel, DocumentSelector, SuccessPanel
- **SEO 메타데이터**: 5 layout.tsx (landing OG, login/onboarding noindex, facility/community 동적 OG)
- **랜딩**: 20,027→20,000+, 유보통합 메시징, 유치원 키워드 확대
- 신규 훅 3개: use-community-detail, use-comments, use-esignature-flow
- 신규 컴포넌트 4개: StepIndicator, LegalClausesPanel, DocumentSelector, SuccessPanel
- CATEGORY_LABELS 공유 유틸 (utils.ts → use-community-posts.ts + use-community-detail.ts)

## R39 변경사항 (2026-02-26)
- **DocumentFormRenderer**: 14종 문서 템플릿 필드 동적 렌더링 (text/date/checkbox/select → Catalyst 컴포넌트)
- **use-esignature-flow**: documentType + formValues 상태, SET_DOCUMENT_TYPE(폼값 리셋), SET_FORM_VALUE 액션
- **sign/page.tsx**: 2섹션 폼(동적 필드 + 서명자 정보), canProceed 검증, clauses 템플릿 법적조항 추가, preview 요약, 제출 body 확장
- 신규 컴포넌트 1개: DocumentFormRenderer

## R41 변경사항 (2026-02-26)
- **4페이지 프리미엄 폴리싱**: community/write, my/support, my/app-info, sign/page
- DS_CARD + DS_PAGE_HEADER 토큰 주입, BrandWatermark 전페이지 배치
- motion/react 마이크로인터랙션: tap.chip(카테고리), hoverLift(카드), spring bounce(아이콘), HeartIcon pulse
- AnimatePresence 스텝 전환 (sign/page), FadeInStagger 순차 등장, scrollFadeIn
- community/write: 글자수 카운터 + 카테고리 아이콘 + DS_CARD.raised 폼 카드
- FAQ open accent 배경 전환, 컨택 카드 raised 스타일

## R40 변경사항 (2026-02-26)
- **DOC_TYPE_LABELS**: snake_case 6종 → 한국어 14종 (MongoDB DOCUMENT_TYPES 동기화, dead code 해소)
- **DocumentView**: raw `documentType` 필드 추가 → sign/page.tsx template lookup 안정화
- **Home 퍼널**: hardcoded currentStep=0 → dashboard interestCount/waitlistCount 기반 동적 계산

## R42 변경사항 (2026-02-26)
- **랜딩 대규모 리팩토링**: 502→233줄 (46% 감소, 콘텐츠 손실 0)
- 중복 섹션 3개 제거: Value Props(Features 중복), Stats(hero StatList 중복), Testimonials(Reviews 중복)
- 시각 리듬 개선: dark→cream×5 → dark→white→cream→white→dark-panel→forest (6색 교차)
- **Radiant DarkBentoSection**: rounded-3xl dark panel + radial gradient glow (요금제 섹션)
- **Salient Pricing**: featured card white-on-dark 반전 + shadow-xl 강조
- **Studio text-balance**: 모든 헤딩 text-balance, 설명 text-pretty 적용
- **ReviewMarquee 버그 수정 2건**: fadeBg prop (gradient 색상 불일치), aria-hidden 전달 수정

## R43 변경사항 (2026-02-27)
- **BrandWatermark 12페이지 적용**: community, waitlist, documents, notifications, interests, settings, login (+기존 5: home, sign, write, app-info, support)
- **Community DS_CARD 토큰화**: 게시글 카드 inline→DS_CARD.flat + hoverLift, 빈 상태 DS_CARD.flat, 카테고리 칩 tap.chip
- 7파일 수정, 빌드 0 에러, 804 테스트 통과

## R44 변경사항 (2026-02-27)
- **BrandWatermark 전체 완성 (18/18)**: my, chat, explore, facility/[id], community/[id], onboarding 6페이지 추가
- R43(12) + R44(6) = 전체 18개 앱 페이지 BrandWatermark 100% 적용
- 6파일 수정, 빌드 0 에러, 804 테스트 통과

## R45 변경사항 (2026-02-27)
- **DS_CARD 토큰 마이그레이션**: 7파일 15건 inline→DS_CARD.flat.base/dark 변환
- `bg-dotori-950/[0.025]` inline 패턴 전체 페이지 **0건** 달성
- dark mode 값 정규화: `/[0.02]`, `/[0.03]`, `/[0.04]` → `DS_CARD.flat.dark` (`dark:bg-white/5`)
- 대상: facility/[id], onboarding, settings, notifications, interests, documents, waitlist

## R47 변경사항 (2026-02-27)
- **Error Boundaries 4개**: (app) retry+홈, (auth) retry+로그인, (landing) dark theme 새로고침, (onboarding) retry+처음부터
- **Loading Skeletons 5개**: (app) home, explore(검색바+카드), chat(버블+입력바), facility/[id] detail, community(피드)
- **문서 정합**: BUSINESS_PLAN.md (20p/54API/804t), CHANGELOG.md (v4.0+R33~R46), 구 문서 2개 아카이브
