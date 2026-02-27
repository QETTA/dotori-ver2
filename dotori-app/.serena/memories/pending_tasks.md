# Pending Tasks (2026-02-27, R59 완료)

## CHECKPOINT (Single Source of Truth)
- **현재**: R59 완료, 다음 R60
- **QA**: 6.6/10 (Home 5.8, Explore 6.7, Facility 6.8, Chat 6.7, My 6.7, Landing 6.8)
- **빌드**: OK (20 pages, 804 tests, 70 files)
- **P0**: 0건 | **P1**: 0건
- **배포**: 수동 전용 (deploy.yml), DO sgp 리전
- **MongoDB**: 20,027 시설 (17개 시도)
- **DO API**: ⚠️ 토큰 만료 (doctl/API 401), 콘솔 수동 배포 필요
- **최신 커밋**: 269aa89 feat(R59)
- **DS 패턴**: DS_CARD.premium 6개, NoiseTexture 31참조, gradientText 11파일

## 보안 상태
- P0 이슈: 0건
- P1 이슈: 0건
- P2 잔여: ~3건 (코드 품질)
- P3 잔여: ~3건 (UX 개선)

## R52~R59 완료 요약

### R52 — Landing 전면 오버홀
- [x] Wallpaper, pricing, FeatureClipCard 재설계
- [x] ReviewMarquee, SocialProofBadge 신규

### R53 — DS 토큰 100%
- [x] DS_GLASS, DS_SHADOW, DS_TEXT, DS_SENTIMENT, DS_STATUS_ALIAS 5종 추가

### R54 — QA 6.1→7.0 도전
- [x] ErrorState 프리미엄, NoiseTexture 컴포넌트, gradient 가시성 강화

### R55 — Triple shadow + gradient text
- [x] outline+edge+glow 3중 shadow, Explore card depth

### R56 — DS_TEXT 전면 적용
- [x] 인라인 색상→DS_TEXT 토큰 일괄 전환, hydration fix

### R57 — UiBlock V2 + DS 토큰 극대화
- [x] rawClassName 1573→939 (−40%)

### R58 — TP5 패턴 100% 전파
- [x] gradientText 11파일, group/card 5파일, snap-mandatory 4파일

### R59 — "7.0 Breakthrough"
- [x] Explore hero DS_CARD.raised + NoiseTexture
- [x] Insight banner → DS_CARD.premium 승격
- [x] ExploreFilterToolbar 결과 라벨 가독성 강화
- [x] ActionCard → DS_CARD.premium + NoiseTexture + DS_TEXT 토큰화
- [x] SeasonalBriefing NoiseTexture + DS_TEXT 토큰화
- [x] FunnelProgressWidget dot indicator 전환 + DS_TEXT
- [x] Facility reviews → DS_CARD.raised 승격
- [x] RecentFacilities → DS_CARD.raised + DS_TEXT 토큰화
- [x] Home stat 카드 accent bar + Hero 통합 리디자인 (사용자 직접 수정)

## Sonnet QA Top Issues (R59)
1. Home 하단 빔 — 뷰포트 하단 콘텐츠 부족 (CSR 캡처 타이밍 이슈 포함)
2. Gradient text 적용 범위 — Home에만 부분 적용, 3페이지+ 필요
3. Chat empty state depth — brand-tinted shadow + border accent 부재

## P2 — 코드 품질
- [ ] 대형 페이지 분리: community/page.tsx (~615줄), chat/page.tsx (~500줄)
- [ ] explore/page.tsx (~600줄) 컴포넌트 분리
- [ ] 중복 유틸리티 통합 (날짜 포맷 등)

## P3 — UX 개선 (잔여)
- [ ] 채팅 이력 날짜 구분선
- [ ] 시설 비교 기능 UX 개선
- [ ] 커뮤니티 게시글 이미지 첨부

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
git log --oneline -5            # 최신: 269aa89 feat(R59)
```
