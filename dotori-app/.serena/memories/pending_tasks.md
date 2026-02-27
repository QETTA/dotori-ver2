# Pending Tasks (2026-02-27, R51 완료)

## CHECKPOINT (Single Source of Truth)
- **현재**: R51 완료, 다음 R52
- **QA**: ~6.5/10 (목표 7.0+, gradient text + 3-layer hover + light theme 적용)
- **빌드**: OK (20 pages, 804 tests, 70 files)
- **P0**: 0건 | **P1**: 0건
- **배포**: 수동 전용 (deploy.yml), DO sgp 리전
- **MongoDB**: 20,027 시설 (17개 시도)

## 보안 상태
- P0 이슈: 0건
- P1 이슈: 0건
- P2 잔여: ~3건 (코드 품질)
- P3 잔여: ~4건 (UX 개선)

## R49 완료 (2026-02-27) — Full-funnel UX Overhaul + P0~P3 Polish
- [x] 20페이지 전환율 극대화 (55파일 +1254/-222)
- [x] 신규 인프라: DS_FAB, DS_STICKY_BAR, DS_STATUS, DS_TYPOGRAPHY 토큰
- [x] 신규 컴포넌트: ActionCard, StickyBottomCTA, ToBadge, ToRiFAB, BundleSignCTA, FacilityTagLink, SocialProofBadge, TrendingRegionChips, AnimatedNumber, NearbyComparison
- [x] Home: ActionCard 퍼널별 동적 CTA + 인기글 섹션
- [x] Facility Detail: StickyBottomCTA + TO 상단 + ToRiFAB
- [x] Explore: ToBadge 인라인 + 빈자리 필터 + ToRiFAB
- [x] Interests: 1-tap 대기 신청 + ToBadge
- [x] Chat: 시설 카드 인라인 액션 + ToBadge
- [x] Documents: BundleSignCTA + DonutGauge 완료율
- [x] Community: FacilityTagLink + TrendingRegionChips + ToRiFAB
- [x] Landing: 시즌 히어로 + AnimatedNumber + SocialProofBadge
- [x] Notifications: 빈자리 → 시설 앵커 + ToBadge
- [x] Onboarding: 4→3단계 축소 + 스킵 링크
- [x] My: FunnelProgressWidget 최상단 + Stats Link + 중복 FunnelSteps 제거
- [x] Waitlist: AnimatedNumber 순번 + 예상 입소일
- [x] Login: gradientText + spring + SocialProofBadge + 브랜드 로고
- [x] Catch-all: ToRiFAB + 유사 경로 추천
- [x] StepIndicator: 완료 구간 forest→dotori 그래디언트
- [x] BottomTabBar: 알림 배지 dot

## P2 — 코드 품질 (다음 라운드 후보)
- [ ] 대형 페이지 분리: community/page.tsx (~615줄), chat/page.tsx (~500줄)
- [ ] explore/page.tsx (~600줄) 컴포넌트 분리
- [ ] 중복 유틸리티 통합 (날짜 포맷 등)

## R50 완료 (2026-02-27) — Visual Impact + Design Quality
- [x] DS_CARD.premium glassmorphism tier (backdrop-blur-lg + brand-tinted shadow)
- [x] DS_CARD.raised shadow: neutral→brand-tinted (dotori-500 rgba)
- [x] My Page: 3-layer hover menu + premium profile card + onboarding CTA (0건 empty state)
- [x] Community: snap-scroll chips + DS_CARD.raised 승격
- [x] Explore: scenario chips 6색→2색 브랜드 통일
- [x] Skeleton: animate-pulse→directional shimmer + stagger delay
- [x] SeasonalBriefing hydration fix (TkDodo ClientGate pattern)
- [x] ㄱ pipeline v7→v8 (디자인 품질 게이트 + TP5 필수 패턴)

## R51 완료 (2026-02-27) — Design Polish + Light Theme 통일
- [x] Gradient text: Home hero, Explore hero, Chat title, Landing hero/sections (bg-clip-text)
- [x] Catalyst Heading→raw elements (clsx text-zinc-950 override 회피)
- [x] 3-Layer hover: ActionCard, Community posts, ExploreResultList (group/card + z-10/z-20)
- [x] DS_CARD.flat shadow 추가 (brand-tinted shadow + ring, 깊이감 Level 2)
- [x] Landing 전면 라이트 테마 (Wallpaper dark→cream, footer CTA 라이트)
- [x] FeatureClipCard idle opacity 0.7→0.9
- [x] SeasonalBriefing hydration fix (useSyncExternalStore)
- [x] explore-utils "0개" 빈 상태 → 안내 문구
- [x] motion.ts gradientTextHero 프리셋 추가

## P3 — UX 개선 (잔여)
- [ ] 탐색(/explore) Bento Grid + 맵/리스트 하이브리드
- [ ] 채팅 이력 날짜 구분선
- [ ] 시설 비교 기능 UX 개선
- [ ] 커뮤니티 게시글 이미지 첨부
- [ ] Sonnet QA ~6.5→7.0+ (TP5 Snap-Scroll, Border Accent+Noise 미적용)

## 외부 작업 (수동)
- [x] 카카오 비즈니스 채널 개설 (@_wxmYIX) — 완료
- [ ] 카카오 개발자 콘솔 도메인 등록

## 비즈니스 마일스톤
- [ ] Toss Payments 연동 (프리미엄 결제)
- [ ] B2B 시설 파트너 5곳 확보
- [ ] 앱스토어/구글플레이 PWA 등록

## 세션 시작 시 확인
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run build                   # 20 pages, 0 errors
npm test                        # 804 tests pass (vitest, 70 files)
git log --oneline -5
```
