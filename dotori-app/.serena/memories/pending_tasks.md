# Pending Tasks (2026-02-24, R23 완료 + CI/CD v2)

## 보안 상태
- P0 이슈: 0건 (R13 전체 수정)
- P1 이슈: 0건 (R13 전체 수정)
- P2 잔여: ~5건 (non-critical, 코드 품질)
- P3 잔여: ~8건 (UX 개선, 타입 정리)
- 상세: `.serena/memories/opus_analysis_r12.md` 참조

## CI/CD v2 완료 항목 (2026-02-24)
- [x] DOCR 레지스트리 생성 (`dotori`, sgp1)
- [x] ci.yml v2: detect → ci(preflight) → docker(GHA BuildKit→DOCR) → deploy(이미지 pull)
- [x] Dockerfile 3레이어 분리 + ARG NEXT_PUBLIC 주입
- [x] app.yaml DOCR 이미지 기반 전환
- [x] .dockerignore 전면 정리 (테스트/스크립트/lint 제외)
- [x] 패치 배포 ~15분 → ~3분 단축

## R22~R23 완료 항목
- [x] 모바일 UX/UI 전면 개선 (R22: 11 에이전트, 49 파일)
- [x] haiku 분석 + frontend-design P0 UX 개선 (R23: 7 에이전트)
- [x] SourceChip spring crash 수정 (랜딩 백지 해결)
- [x] NODE_ENV prerender crash 해결 (env -u NODE_ENV)
- [x] 디자인 시스템 토큰 도입 (DS_TYPOGRAPHY, DS_GLASS 등)
- [x] 파이프라인 v7: wave 빌드 + codex-wave.sh + haiku QA 위임
- [x] 테스트 106→111개 (16 files)

## 파이프라인 개선 완료 (v7 + CI/CD v2)
- [x] Wave 빌드 (launch.sh v7 — 4개씩 wave, inter-wave tsc 검증)
- [x] codex-wave.sh (CLI 병렬 배치, MCP 직렬 우회)
- [x] NODE_ENV 방어 (env -u NODE_ENV 전 빌드 커맨드)
- [x] 디버깅 루프 3회 제한 규칙 (CLAUDE.md)
- [x] haiku 스크린샷 분석 위임 패턴 (CLAUDE.md)
- [x] 태스크 설계 메모리 저장 (task_designs/rN.md)
- [x] CI/CD v2 DOCR 파이프라인 (GHA BuildKit 캐시 + pre-built 이미지)

## 즉시 조치 필요 🔴
- [ ] **DO API 토큰 재생성** (채팅 노출) → GitHub Secrets `DIGITALOCEAN_ACCESS_TOKEN` 업데이트
- [ ] main에 CI/CD v2 변경사항 push → 첫 DOCR 이미지 빌드+배포 실행

## P2 — 코드 품질 (다음 라운드 후보)
- [ ] 대형 페이지 분리: community/page.tsx (~615줄), onboarding (~743줄), my/waitlist (~634줄)
- [ ] explore/page.tsx (~600줄), chat/page.tsx (~500줄) 컴포넌트 분리
- [ ] 중복 유틸리티 통합 (날짜 포맷 등)
- [ ] E2E 테스트 실행환경 구성 (dev server 필요)

## P3 — UX 개선 (잔여)
- [ ] 채팅 이력 날짜 구분선
- [ ] 시설 비교 기능 UX 개선
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
cd /home/sihu2/dotori-ver2-qetta/dotori-app
env -u NODE_ENV npm run build   # 47 pages, 0 errors
npm test                         # 111 tests pass (vitest, 16 files)
git log --oneline -5

# 메모리 확인 (이전 세션 컨텍스트 복원)
cat .serena/memories/pending_tasks.md
ls .serena/memories/task_designs/   # 이전 라운드 설계 확인
```

## 태스크 설계 저장 규칙
```
라운드 시작 전:
1. 분석 결과 → Serena 메모리에 저장
2. 에이전트별 태스크 설계 → task_designs/rN.md
3. agent_task_registry.md 갱신 (파일 소유권)

라운드 완료 후:
1. task_designs/rN.md에 결과 기록 (OK/FAIL/커밋해시)
2. pending_tasks.md 갱신
3. project_overview.md 갱신 (상태 업데이트)
```
