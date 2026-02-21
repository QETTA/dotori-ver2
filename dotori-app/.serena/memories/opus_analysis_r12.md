# Opus 4.6 코드베이스 분석 결과 (R12 이후, 2026-02-22)

## P0 (치명) - 4건
1. **CLAUDE.md 시크릿 노출** - MongoDB 비밀번호 + AUTH_SECRET 평문 노출 (CLAUDE.md:91-92)
2. **plan 자가 변경** - PATCH /api/users/me에서 plan 필드 허용 → 무료 프리미엄 (users/me/route.ts:26,37-40)
3. **결제 미검증 구독** - POST /api/subscriptions에서 결제 없이 premium 활성화, amount:0 하드코딩 (subscriptions/route.ts:49-86)
4. **게스트 채팅 제한 우회** - x-chat-guest-usage 헤더가 클라이언트 조작 가능 (chat/stream/route.ts:99-104)

## P1 (높음) - 5건
5. **인메모리 rate limit** - 서버리스 환경에서 무효 (middleware.ts:8)
6. **middleware 메모리 누수** - rateLimitMap에 정리 로직 없음 (middleware.ts:8,28-44)
7. **NoSQL $text 주입** - 사용자 메시지 직접 $search에 전달 (response-builder.ts:696,915)
8. **admin API 인증 부재** - CRON_SECRET만으로 인증 (admin/facility/[id]/premium/route.ts:29-36)
9. **채팅 스트림 미종료** - 에러 시 스트림 열린 채 남을 수 있음 (chat/stream/route.ts:271-441)

## P2 (보통) - 10건
10. nba-engine.ts non-null assertion 8곳 (163,166,260,263,304-306,354)
11. page.tsx:70-71 불필요한 user! assertion
12. waitlist/page.tsx:406-407 non-null assertion
13. explore/page.tsx 967줄 거대 컴포넌트
14. chat/page.tsx 871줄 거대 컴포넌트
15. response-builder.ts:79-243 하드코딩 지역 매핑 165줄
16. API 라우트 35개 중 테스트 0개
17. 중복 테스트 파일 (src/__tests__/engine/ vs src/lib/engine/__tests__/)
18. subscriptions/route.ts body 이중 파싱
19. waitlist/route.ts rawBody 이중 파싱

## P3 (낮음) - 14건
20-33: auth.config non-null, authorId 노출, 타입 캐스팅, 들여쓰기 불일치, 중복 메시지, 스켈레톤 위치, eslint-disable, as const 반복, 비프리미엄 알림 즉시 비활성화, UsageLog 모델 중복, childBirthDate 하드코딩

## 양호 사항
- color="green" 미사용, framer-motion 미사용 ✅
- any 타입 제로 ✅
- console.log 잔존 없음 ✅
- withApiHandler 패턴 잘 적용 ✅
- Zod 입력 검증 잘 적용 ✅
