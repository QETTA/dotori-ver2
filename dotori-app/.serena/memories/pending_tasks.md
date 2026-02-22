# Pending Tasks (2026-02-22, R13 완료 후)

## 보안 상태
- P0 이슈: 0건 (R13 전체 수정)
- P1 이슈: 0건 (R13 전체 수정)
- P2 잔여: ~5건 (non-critical, 코드 품질)
- P3 잔여: ~10건 (UX 개선, 타입 정리)
- 상세: `.serena/memories/opus_analysis_r12.md` 참조

## P2 — 코드 품질 (다음 라운드 후보)
- [ ] 대형 컴포넌트 분리: explore/page.tsx (~600줄), chat/page.tsx (~500줄)
- [ ] Facility 검색 API 테스트 커버리지 확대
- [ ] 타입 캐스팅 정리 (`as unknown as` 패턴)
- [ ] 중복 유틸리티 통합 (날짜 포맷 등)

## P3 — UX 개선
- [ ] 채팅 이력 날짜 구분선
- [ ] 시설 비교 기능 UX 개선
- [ ] 알림 설정 UI 리팩토링
- [ ] 커뮤니티 게시글 이미지 첨부

## 외부 작업 (수동)
- [ ] 카카오 비즈니스 채널 개설 (@dotori_kr)
- [ ] 카카오 개발자 콘솔 도메인 등록
- [ ] 소상공인 프로젝트 단골 신청 (30만원 캐시)

## 비즈니스 마일스톤
- [ ] Toss Payments 연동 (프리미엄 결제)
- [ ] B2B 시설 파트너 5곳 확보
- [ ] 앱스토어/구글플레이 PWA 등록

## 세션 시작 시 확인
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run build     # 47 pages, 0 errors
npm test          # 91 tests pass (vitest)
git log --oneline -5
```
