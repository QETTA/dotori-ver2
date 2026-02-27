# Pending Tasks (2026-02-28, R62 완료)

## CHECKPOINT (Single Source of Truth)
- **현재**: R62 완료, 다음 R63
- **QA**: **7.4/10** (R61 — 7.0 게이트 통과, Home 7.7, Chat 7.8, Landing 7.7, Community 7.5, My 7.2, Explore 6.7)
- **빌드**: OK (20 pages, 804 tests, 70 files)
- **P0**: 0건 | **P1**: 0건
- **배포**: 수동 전용 (deploy.yml), DO sgp 리전
- **MongoDB**: 20,027 시설 (17개 시도)
- **DO API**: ⚠️ 토큰 만료 (doctl/API 401), 콘솔 수동 배포 필요
- **최신 커밋**: c6949aa feat(R62) heroicons 완전 제거 + dead code cleanup
- **DS 패턴**: DS_ 참조 914건, lucide 57종 (heroicons 0), group/card 15건, auto-animate 6건
- **heroicons 잔여**: 0파일 ✅ (@heroicons/react 패키지 완전 제거)

## 보안 상태
- P0 이슈: 0건
- P1 이슈: 0건
- P2 잔여: ~3건 (코드 품질)
- P3 잔여: ~3건 (UX 개선)

## R52~R62 완료 요약

### R52~R59 (이전 라운드, 상세 생략)

### R60 — "Warm Liquid Glass" (2 commits: ba347e8, 3de6b50)
- [x] DS Foundation 2.0: DS_SPACING, DS_ICON, DS_GRADIENT, DS_INTERACTIVE, DS_ZINDEX
- [x] DS_CARD.glass (Liquid Glass 2.0), DS_SECTION_RHYTHM, DS_HERO
- [x] Motion presets: parallaxFade, listAutoAnimate, liquidReveal, iconSwap
- [x] culori color-utils: getCapacityColor, validateDsContrast, autoFixContrast
- [x] icon-map.ts + DotoriIcon.tsx 아이콘 매핑 시스템
- [x] SVG 최적화 (svgo -25%), heroicons→lucide 50종 (33파일)
- [x] auto-animate 6곳, group/card 15건, Skeleton brand-tinted shimmer
- [x] R60 CSS 유틸리티 10/11 활용

### R61 — QA 6.9→7.4 (1 commit: 343a8ae)
- [x] Community gradient text 충돌 수정 (DS_PAGE_HEADER.title→raw classes)
- [x] Community heroicons→lucide 4종
- [x] Explore map empty state DS_CARD.premium 승격
- [x] My quick-start 3-card grid (빈 뷰포트 밀도 개선)
- [x] 7.0 게이트 통과

### R62 — heroicons 완전 제거 + dead code cleanup (1 commit: c6949aa)
- [x] heroicons→lucide 4파일 (BottomTabBar, FunnelSteps, [...slug], facility/[id])
- [x] @heroicons/react 패키지 언인스톨 (645 packages, 0 vuln)
- [x] DS_STATES 미사용 토큰 제거
- [x] card-flip 미사용 CSS 유틸리티 제거
- [x] next.config.ts + CLAUDE.md 정리

### R60 Deferred (완료/해소)
- [x] heroicons 잔여 → R62에서 완전 해소
- [x] card-flip → 미사용 CSS 제거 (pricing 토글 UI 미구현, 불필요 코드 제거)
- [x] DS_STATES → 미사용 토큰 제거 (Tailwind variant prefix 제약으로 실적용 불가)
- [ ] BrandWatermark SVGR: img→React 컴포넌트 (구조 변경 필요, P3)

## Sonnet QA 이력
- R59: 6.6/10 (Home 5.8, Explore 6.7, Facility 6.8, Chat 6.7, My 6.7, Landing 6.8)
- R60: 6.9/10 (Home 7.3, Explore 6.3, Facility 6.3, Chat 7.5, My 6.3, Landing 7.7)
- **R61: 7.4/10** (Home 7.7, Chat 7.8, Landing 7.7, Community 7.5, My 7.2, Explore 6.7) ← 7.0 게이트 통과

## P2 — 코드 품질
- [ ] 대형 페이지 분리: community/page.tsx (~190줄), chat/page.tsx (~223줄)
- [ ] explore 컴포넌트 분리 (이미 ExploreSearchHeader/ResultList/MapToggle 분리됨)
- [ ] 중복 유틸리티 통합 (날짜 포맷 등)

## P3 — UX 개선 (잔여)
- [ ] 채팅 이력 날짜 구분선
- [ ] 시설 비교 기능 UX 개선
- [ ] 커뮤니티 게시글 이미지 첨부
- [ ] BrandWatermark SVGR 컴포넌트 전환

## 외부 차단 (수동)
- [ ] DO API 토큰 갱신 (doctl auth init 또는 콘솔에서 재발급)
- [ ] 카카오 개발자 콘솔 도메인 등록
- [ ] Toss Payments 계약 → 결제 검증 로직 교체
- [ ] Solapi 계정 → 알림톡 실발송
- [ ] 모두싸인 계약 → 전자서명 하이브리드 연동
- [ ] KOSIS/MOIS API 키 → TO예측 Layer 3 활성화
- [ ] 5개 공공 API 키 신청 (Phase 0)

## 비즈니스 마일스톤
- [ ] 공공 API 5건 연동 (v4.0 Phase 1)
- [ ] TO 예측 엔진 실데이터 (v4.0 Phase 2)
- [ ] 전자서명 7종 실운영 (v4.0 Phase 2)
- [ ] B2B 시설 파트너 5곳 확보
- [ ] 앱스토어/구글플레이 PWA 등록

## 세션 시작 시 확인
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run build                   # 20 pages, 0 errors
npm test                        # 804 tests pass (vitest, 70 files)
git log --oneline -5            # 최신: c6949aa feat(R62)
```
