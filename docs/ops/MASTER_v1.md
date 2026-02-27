# DOTORI MASTER DOCUMENT v1.3
> **최종 업데이트:** 2026-02-26
> **용도:** 운영자 & 새 Claude 세션이 프로젝트 전체를 즉시 파악하기 위한 단일 마스터 자료
> **관련 문서:** [KAKAO_CHANNEL.md](./KAKAO_CHANNEL.md) · [PREMIUM_SPEC.md](./PREMIUM_SPEC.md) · [BUSINESS_PLAN.md](./BUSINESS_PLAN.md)

---

## 1. 프로젝트 개요

**도토리(Dotori)** — 전국 보육·교육시설(어린이집·유치원) 탐색 · 이동 지원 서비스.
2026년 저출산 시대, 정원미달 시설이 급증하는 환경에서 **이미 어린이집을 다니고 있지만 옮기고 싶은 부모**를 초기 타겟으로, 부모에게는 이동 탐색 도구를, 시설에게는 원아모집 채널을 제공하는 양면 플랫폼.

**초기 포지셔닝 (2026):** "지금 다니는 어린이집, 정말 괜찮으신가요?" — 이동 수요 공략

**핵심 수치:**
- 현재 **20,027개** 시설 데이터 보유 (17개 시도) → 목표 **35,887개** (어린이집 27,387 + 유치원 8,500)
- 어린이집+유치원 2025년 3.43만 → 2028년 2.71만 축소 전망
- 경기도 국공립 정원 충족률 81.9%

**리포지토리:** github.com/QETTA/dotori-ver2

---

## 2. 기술 스택 & 인프라

| 구분 | 기술 |
|------|------|
| 프론트/백엔드 | **Next.js 16.1** (App Router) + **React 19** + **TypeScript 5.8** strict + **Tailwind CSS 4** |
| UI | @headlessui/react 2.2 + @heroicons/react 2.2 + **Catalyst UI Kit** (27 컴포넌트) |
| 애니메이션 | **motion/react** (motion 12) — framer-motion 사용 금지 |
| DB | MongoDB Atlas (클러스터: kidsmap, DB명: dotori) + **Mongoose 8.23** |
| 검색 | Atlas Search 인덱스 facility_search |
| 배포 | **DigitalOcean App Platform** (source-only, `create-deployment`) |
| CI | **GitHub Actions** (`ci.yml`: lint + typecheck + test) |
| 배포 | **수동 전용** (`deploy.yml`: workflow_dispatch, CI 게이트 + 스펙 검증) |
| 인증 | **NextAuth v5** (next-auth@beta), Kakao OAuth, JWT 전략 |
| AI | **Anthropic Claude** (Sonnet 4.6), SSE streaming + @anthropic-ai/sdk |
| 지도 | Kakao Map SDK |
| 결제(준비) | Toss Payments |
| 검증 | **Zod** (API 입력 검증) |
| 테스트 | **Vitest** (804개, 70 파일) + **Playwright** (E2E) |

**현재 규모:** 20 pages, 54 API routes, 21 Mongoose 모델, 139 컴포넌트

**개발 서버:** /home/sihu2129/dotori-ver2/dotori-app
**에이전트:** Claude Code(Opus 4.6) → Serena MCP(메모리) → Codex CLI(워크트리 병렬, 최대 11개)

---

## 3. 초기 운영 법인

**법인명:** 주식회사 레인피플 (Rain People)
**등록번호:** 160111-0700058
**본점:** 대전광역시 유성구 유성대로 773, 금수빌딩 3층 301호
**자본금:** 1,000만원 / **설립:** 2024.11

**도토리 관련 목적사업:** 데이터베이스 및 온라인 정보제공업, 전자상거래업, 인터넷 관련 정보서비스업, SW 개발 및 공급업, 컴퓨터 프로그래밍 서비스업
→ 카카오 비즈니스 채널 업종 불일치 리스크 제로, 교육 인허가 불필요

---

## 4. CI/CD & 배포 상태

### CI/CD Pipeline v7 — Manual-Only Deploy (2026-02-26)

```
main push → CI(lint+typecheck+test)
수동 배포 → deploy.yml(workflow_dispatch) → CI 게이트 → create-deployment → health check
```

| 항목 | 상세 |
|------|------|
| CI 트리거 | main push, PR, workflow_dispatch |
| 배포 트리거 | **수동 전용** (`gh workflow run deploy.yml`) |
| 자동 배포 | **없음** (main push는 CI만 실행) |
| 배포 방식 | DO App Platform source 모드 (`github` + `dockerfile_path`) |
| 가드 | CI 게이트 + 스펙 검증 + SHA 중복 체크 + `doctl apps update --spec` 금지 |
| 패치 배포 | 평균 ~3-5분 (소스 리빌드 + 헬스체크) |
| Health check | `/api/health`, `/api/health/deep` |
| 릴리즈 감시 | `release-audit.yml` (매일 09:15 UTC, 모니터링 전용) |

**파이프라인:** CI ✅ → 수동 deploy.yml ✅ → active commit SHA 검증 ✅

**완료 라운드:** R1~R3(36), R5(11), R8(11), R9(11), R11(6), R12(5), R13(11), R17(11), R22(11), R23(7), R32~R45 = **159+ 에이전트**
**보안 수정:** Opus 4.6 분석 P0 4건 + P1 5건 전체 수정 완료 (R13)

---

## 5. 현재 과제

| # | 이슈 | 심각도 | 상태 |
|---|------|--------|------|
| 1 | DO 리전 nrt 무효 | ✅ | sgp 완료 |
| 2 | MongoDB 비밀번호 | ✅ | DO 환경변수 확인 완료 |
| 3 | 카카오 채널 개설 | ✅ | 개설 완료 (@_wxmYIX) |
| 4 | 이동 수요 타겟 메시지 | ✅ | 완료 |
| 5 | 프리미엄 구현 | ✅ | R9에서 완료, R13에서 보안 강화 |
| 6 | 보안 P0~P1 | ✅ | R13에서 전체 수정 |
| 7 | CI/CD 배포 혼선 | ✅ | v7 수동 전용 배포 + 자동 트리거 전면 제거 |
| 8 | DO 토큰 재생성 | ✅ | 2026-02-26 교체 완료, 앱 전용 스코프 |

---

## 6. 브랜드 & 톤앤매너

- dotori(브라운)=CTA, forest(초록)=성공/Badge, amber=카카오전용
- 엄마 언어 사용, 기능카탈로그 금지, 공감→해결 순서
- "프리미엄"은 B2B만, 부모에겐 "인증 시설"

---

## 7. 핵심 명령

```bash
cd /home/sihu2129/dotori-ver2/dotori-app
npm run dev             # 개발 서버
npm run build                   # 빌드 (20 pages)
npm test                        # 테스트 (804개, vitest, 70 files)
npm run ci:preflight    # lint + typecheck + test (빌드 제외)
```

**배포:**
```bash
# 수동 배포 (권장)
gh workflow run deploy.yml -R QETTA/dotori-ver2

# 긴급 직접 배포
doctl apps create-deployment 29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2
```

---

## 8. v4.0 핵심 방향 (유보통합 대응)

- **유보통합 선제 대응**: 어린이집+유치원 → '영유아학교' 통합 검색·TO예측·전자서명
- **풀퍼널 매칭**: 탐색 → TO예측 → 견학 → 전자서명 입소계약 (2~3시간 → 10분)
- **TO 예측 엔진**: `TO = 정원 - 현원 + 예상졸업 - 예상수요 × 시설매력도`
- **전자서명 7종**: Canvas+PDF 자체 + 모두싸인 하이브리드
- **수익 확장**: B2C CPA → B2B SaaS (44K~132K/월) → B2B2B → B2G 지자체
- **상세 전략**: [STRATEGY_v4.0.md](../STRATEGY_v4.0.md) (v3.0 디프리케이트)

> 세부: KAKAO_CHANNEL.md · PREMIUM_SPEC.md · BUSINESS_PLAN.md
