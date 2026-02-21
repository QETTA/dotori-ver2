# Agent Task Registry — Codex 에이전트 공유 메모리

## 목적
이 파일은 Claude Code가 Codex 워크트리 에이전트에게 전달하는 작업 레지스트리.
각 Codex 에이전트는 작업 시작 전 반드시 이 파일을 읽어야 함.

## 파일 소유권 맵 (충돌 방지)
각 에이전트는 아래 파일만 수정. 다른 에이전트 파일 수정 금지.

| 에이전트 ID | 담당 파일/디렉터리 | 주의사항 |
|------------|-------------------|---------|
| chat-agent | `src/app/(app)/chat/`, `src/app/api/chat/` | SSE 스트림 유지 |
| explore-agent | `src/app/(app)/explore/`, `src/hooks/use-facilities.ts` | API 호환 유지 |
| engine-agent | `src/lib/engine/`, `src/lib/ai/` | buildResponse 인터페이스 유지 |
| ui-agent | `src/components/dotori/` | Catalyst 컴포넌트 수정 금지 |
| my-agent | `src/app/(app)/my/` | auth 패턴 유지 |
| api-agent | `src/app/api/` (chat 제외) | withApiHandler 패턴 유지 |

## 공유 타입 (변경 시 모든 에이전트 영향)
- `src/types/dotori.ts` — ChatMessage, ChatBlock, Facility, UserProfile
- `src/lib/engine/intent-classifier.ts` — ChatIntent 타입
- `src/lib/engine/response-builder.ts` — ConversationContext, buildResponse

## 현재 진행 중인 작업
(Claude Code가 새 라운드 시작 시 업데이트)

## 완료된 주요 작업 이력
- SSE 스트리밍: `/api/chat/stream` 구현 (2026-02-22)
- MarkdownText.tsx 생성 (2026-02-22)
- ChatBubble 타이핑 dots 애니메이션 (2026-02-22)
- kidsmap 레거시 DB 삭제, dotori DB 전용화 (2026-02-22)
- 지역 인식 22개 추가 (인천/대구/대전/세종/송도/청라/마곡) (2026-02-22)
