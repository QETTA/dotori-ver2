# CLAUDE.md — Dotori V2 Workspace Root

## Workspace Structure

```
/home/sihu2129/dotori-ver2/
├── dotori-app/          ★ MAIN APP — 모든 개발 작업은 여기서
├── brand/               브랜드 소스 에셋 (SVG, CSS, docs)
├── docs/                프로젝트 사양서 (V3 Part 1-4, Master Spec)
├── reference/           참조 전용 (Catalyst UI Kit, 템플릿, 레거시 백엔드)
├── .claude/             MCP 서버 설정 (Codex Spark 5.3, Memory, Context7)
└── .env.local           환경 변수 (dotori-app에도 복사본 있음)
```

## Working Directory

**항상 `dotori-app/` 경로에서 작업할 것.** 루트는 workspace 조직용.

```bash
cd /home/sihu2129/dotori-ver2/dotori-app
```

## App-level Instructions

**앱 상세 규칙은 `dotori-app/CLAUDE.md` 참조** — 그 파일이 앱 개발의 마스터 가이드.

## 모델 전략 (2026-02-22~)

**Claude Code: Sonnet 4.6** (Opus 주간 할당량 절약)
**Codex MCP: gpt-5.3-codex-spark** (ChatGPT Pro 무제한 — 적극 활용)

### Codex 위임 정책 (필수)

Opus 토큰 절약을 위해 **코드 생성/분석 작업은 Codex MCP로 최대한 위임**:

| 작업 유형 | 담당 | 이유 |
|-----------|------|------|
| 새 컴포넌트/페이지 생성 | **Codex** | 대량 코드 생성 = 토큰 많이 소모 |
| 멀티파일 리팩토링 | **Codex** | 여러 파일 읽기+쓰기 |
| 버그 분석 + 수정안 제시 | **Codex** | 코드 탐색 + 추론 |
| API 라우트 구현 | **Codex** | 보일러플레이트 많음 |
| 빌드 에러 디버깅 | **Codex** | 로그 분석 + 수정 |
| 간단 수정 (1-2줄) | Claude | 빠른 직접 수정이 효율적 |
| 파일 읽기/검색 | Claude | 도구 직접 호출이 빠름 |
| git/배포/인프라 | Claude | CLI 도구 직접 실행 |
| 의사결정/설계 | Claude | 대화 컨텍스트 필요 |

### Codex 호출 패턴

```
# 코드 생성 시 — mcp__codex__codex 사용
mcp__codex__codex(prompt="...", approval-policy="never", sandbox="workspace-write")

# Task 서브에이전트 — haiku 모델로 비용 절감
Task(subagent_type="general-purpose", model="haiku", ...)
```

**원칙: "코드를 쓸 때는 Codex, 판단할 때는 Claude"**

## MCP Servers

| 서버 | 모델/용도 | 상태 |
|------|-----------|------|
| codex | gpt-5.3-codex-spark (xhigh reasoning) | ★ 주력 코드 생성 |
| serena | TypeScript LSP 코드 분석 | 심볼 검색/수정 |
| context7 | @upstash/context7-mcp | 라이브러리 문서 조회 |
| mongodb | MongoDB Atlas readOnly | DB 쿼리/스키마 |
| playwright | @playwright/mcp | 브라우저 자동화 |
| github | GitHub MCP (settings.local) | PR/이슈 관리 |

## Key Commands

```bash
cd dotori-app && npm run dev        # 개발 서버 (port 3000)
cd dotori-app && npm run build      # 프로덕션 빌드
cd dotori-app && npm run screenshot # 모바일 스크린샷
```

## @몽고db — MongoDB 직접 작업 모드

사용자가 `@몽고db` 언급 시 아래 규칙 적용:

**원칙: DB만 건드리고, 앱 코드는 절대 수정 금지**

- **도구**: `mongosh` 직접 접속 (글로벌 설치 완료 v2.7.0)
- **스크립트**: `/tmp/*.js` 임시 파일로 실행 후 삭제
- **앱 코드 수정 금지**: `src/`, `scripts/`, `components/` 등 프로젝트 파일 절대 미수정
- **Kakao API 사용 가능**: 지오코딩, 역지오코딩, 키워드 검색

```bash
# 접속
MONGODB_URI=$(grep MONGODB_URI ~/dotori-ver2/dotori-app/.env.local | cut -d= -f2-)
mongosh "$MONGODB_URI" --db dotori

# mongosh에서 JS 파일 실행
mongosh "$MONGODB_URI" --quiet --file /tmp/작업명.js

# Kakao API 필요시 환경변수 전달
KAKAO_REST_API_KEY=$(grep KAKAO_REST_API_KEY ~/dotori-ver2/dotori-app/.env.local | cut -d= -f2-)
KAKAO_REST_API_KEY="$KAKAO_REST_API_KEY" mongosh "$MONGODB_URI" --quiet --file /tmp/작업명.js
```

**DB 현황** (2026-02-20, Phase 1-5 완료):
- `dotori.facilities`: 20,027 문서, 17개 시도
- 인덱스 13개 (2dsphere, region, type, kakaoPlaceId sparse, dataQuality, capacity 등)
- Kakao Place: 85.6% (17,142건)
- 교직원수: 93.0% | 보육실수: 71.9% | 홈페이지: 9.5%
- features: CCTV 11k, 소규모 8.5k, 통학버스 8.5k, 놀이터 6k, 대규모 2.2k
- 평균 품질점수: 62.1/100 (dataQuality.score)
- 미수집: capacity.current, rating, programs (공공데이터 미제공)

## Dev Cycle 축약어 (dotori-app/CLAUDE.md 참조)

| 입력 | 동작 |
|------|------|
| `ㄱ` | 분석→태스크→병렬실행→**직접검증**→빌드→리포트 (1회) |
| `ㄱㄱ` | 위 사이클 반복 (리포트 후 자동 재시작) |
| `ㅂ` | 빌드 검증만 (에러 확인 + 파일 상태) |
| `ㅅ` | 모바일 스크린샷 캡처 |

**핵심 원칙: 에이전트 출력 맹신 금지. 모든 결과 직접 파일 확인 + 빌드 통과 필수.**

## Brand Color Quick Ref

- `color="dotori"` — 브랜드 Primary CTA (brown #c8956a)
- `color="amber"` — 카카오 전용 (절대 앱 CTA에 사용 금지)
- `color="forest"` — Success/Available 상태
