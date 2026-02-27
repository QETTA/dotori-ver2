# Opus 4.6 코드베이스 분석 결과 (R12 이후, 2026-02-22)

## P0 (치명) - 4건 → ✅ R13에서 전부 수정
1. ~~CLAUDE.md 시크릿 노출~~ ✅ 제거
2. ~~plan 자가 변경~~ ✅ plan 필드 strip 처리
3. ~~결제 미검증 구독~~ ✅ 결제 검증 로직 추가
4. ~~게스트 채팅 제한 우회~~ ✅ 서버사이드 카운팅

## P1 (높음) - 5건 → ✅ R13에서 전부 수정
5. ~~인메모리 rate limit~~ ✅ sliding window 구현
6. ~~middleware 메모리 누수~~ ✅ WeakMap + TTL 정리
7. ~~NoSQL $text 주입~~ ✅ 입력 sanitize
8. ~~admin API 인증 부재~~ ✅ Bearer CRON_SECRET 검증
9. ~~채팅 스트림 미종료~~ ✅ finally 블록 정리

## P2 (보통) - 10건 (미수정, R14 후보)
10. nba-engine.ts non-null assertion 8곳 (163,166,260,263,304-306,354)
11. page.tsx:70-71 불필요한 user! assertion
12. waitlist/page.tsx:406-407 non-null assertion
13. explore/page.tsx 967줄 거대 컴포넌트
14. chat/page.tsx 871줄 거대 컴포넌트
15. response-builder.ts:79-243 하드코딩 지역 매핑 165줄
16. API 라우트 35개 중 테스트 0개
17. ~~중복 테스트 파일~~ ✅ vitest 통합으로 해소
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

## 추가 수정 (레포 건전성 P0+P1, 세션 후반)
- Jest→Vitest 통합: 9파일/91테스트 (기존 jest.config가 7파일 숨김)
- dto.ts premium 조건부 spread 수정
- 데드 파일 삭제: brand-copy.ts, landing/FAQ.tsx
- app.yaml 유령 env 9개 제거, GA_ID 추가
- sharp → dependencies 이동 (Docker 빌드 실패 방지)
