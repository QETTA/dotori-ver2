# API 키 & 시크릿 재발급 상태 추적

> **최종 업데이트**: 2026-02-20
> **자동 생성**: Opus 4.6 + Codex 5.3 교차 검수
> **갱신 주기**: 매 테스트 사이클마다 자동 업데이트

---

## 상태 범례

| 아이콘 | 의미 |
|--------|------|
| ✅ | 정상 — 유효, 코드에서 사용 중 |
| ⚠️ | 주의 — 만료 임박 또는 플레이스홀더 |
| ❌ | 오류 — 만료/무효/재발급 필요 |
| 🔒 | 미사용 — 코드에서 아직 미구현 |
| 💤 | 비활성 — 주석 처리됨 (Phase 2+) |

---

## 1. 인증 & 세션

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `AUTH_SECRET` | NextAuth v5 | ⚠️ 개발용 | 없음 | `openssl rand -base64 32` | **프로덕션 전 반드시 변경** — 현재 하드코딩 dev 값 |
| `NEXTAUTH_SECRET` | NextAuth v4 | ⚠️ 중복 | 없음 | AUTH_SECRET과 동일 | AUTH_SECRET으로 통합 필요 |
| `AUTH_KAKAO_ID` | 카카오 OAuth | ✅ 정상 | 없음 | [카카오 개발자](https://developers.kakao.com) → 앱 → REST API 키 | = KAKAO_CLIENT_ID |
| `AUTH_KAKAO_SECRET` | 카카오 OAuth | ✅ 정상 | 없음 | [카카오 개발자](https://developers.kakao.com) → 앱 → 보안 → Client Secret | = KAKAO_CLIENT_SECRET |
| `GITHUB_TOKEN` | GitHub PAT | ⚠️ 만료 주의 | **PAT 유효기간 확인 필요** | [GitHub Settings](https://github.com/settings/tokens) → Fine-grained tokens | PAT은 보통 30~90일 만료 |

### 재발급 액션
```bash
# AUTH_SECRET 프로덕션 생성
openssl rand -base64 32

# GitHub PAT 만료 확인
gh auth status
```

---

## 2. AI 프로바이더

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `ANTHROPIC_API_KEY` | Claude Opus 4.6 | ✅ 정상 | 크레딧 소진 시 | [console.anthropic.com](https://console.anthropic.com) → API Keys | 메인 AI — 잔액 모니터링 필수 |
| `OPENAI_API_KEY` | GPT-4o-mini | ❌ 플레이스홀더 | — | [platform.openai.com](https://platform.openai.com/api-keys) | `sk-xxxxxxxx` — 실제 키 아님 |
| `SPARK_API_KEY` | Spark 5.3 | 💤 비어있음 | — | Phase 2 출시 후 발급 | 아직 서비스 미출시 |

### 재발급 액션
```bash
# Anthropic 잔액 확인
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-opus-4-6","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}'
# → 200이면 유효, 401이면 재발급 필요
```

---

## 3. 카카오 API

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `KAKAO_CLIENT_ID` | REST API 키 | ✅ 정상 | 없음 | [developers.kakao.com](https://developers.kakao.com) → 내 앱 | OAuth + REST 공용 |
| `KAKAO_CLIENT_SECRET` | Client Secret | ✅ 정상 | 없음 | 앱 → 보안 → Client Secret 재발급 | 재발급 시 기존 키 즉시 무효 |
| `NEXT_PUBLIC_KAKAO_KEY` | JavaScript 키 | ✅ 정상 | 없음 | 앱 → 앱 키 → JavaScript 키 | SDK 초기화용 (공개 OK) |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | JavaScript 키 | ✅ 중복 | 없음 | = NEXT_PUBLIC_KAKAO_KEY | 하나로 통합 권장 |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | Native App 키 | ✅ 정상 | 없음 | 앱 → 앱 키 → Native App 키 | 지도 API용 |
| `KAKAO_REST_API_KEY` | REST API 키 | ✅ 중복 | 없음 | = KAKAO_CLIENT_ID | 하나로 통합 권장 |
| `NEXT_PUBLIC_KAKAO_CHANNEL_ID` | 채널 ID | ⚠️ 확인 필요 | 없음 | [business.kakao.com](https://business.kakao.com) → 채널 관리 | `_dotori` — 채널 개설 후 실제 ID로 교체 |

### 카카오 콘솔 체크리스트
- [ ] Redirect URI 등록: `http://localhost:3000/api/auth/callback/kakao`
- [ ] Redirect URI 등록 (프로덕션): `https://dotori.app/api/auth/callback/kakao`
- [ ] 동의항목: `profile_nickname`, `profile_image`, `account_email`
- [ ] 카카오 로그인 활성화 상태 확인
- [ ] 채널 `_dotori` 개설 상태 확인

---

## 4. 네이버 API

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `NAVER_CLIENT_ID` | 네이버 로그인 | 🔒 미사용 | 없음 | [developers.naver.com](https://developers.naver.com) | 코드에서 미구현 |
| `NAVER_CLIENT_SECRET` | 네이버 로그인 | 🔒 미사용 | 없음 | 같은 앱 페이지 | 코드에서 미구현 |

---

## 5. 데이터베이스

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `MONGODB_URI` | MongoDB Atlas | ✅ 정상 | 없음 | [cloud.mongodb.com](https://cloud.mongodb.com) → Database Access | 2026-02-20 비밀번호 재설정 완료, atlasAdmin 권한 |
| `DATABASE_URL` | MongoDB Local | 🔒 미사용 | — | 로컬 replica set 설정 | 레거시 호환용 |
| `SUPABASE_URL` | Supabase | 🔒 미사용 | 없음 | [supabase.com](https://supabase.com) → Settings → API | 보조 DB (미구현) |
| `SUPABASE_ANON_KEY` | Supabase JWT | 🔒 미사용 | **2035-12-28** | 같은 페이지 | JWT exp 확인됨 |
| `SUPABASE_SERVICE_KEY` | Supabase JWT | 🔒 미사용 | **2035-12-28** | 같은 페이지 | 서비스 롤 키 |
| `SUPABASE_DATABASE_URL` | PostgreSQL | 🔒 미사용 | 없음 | Settings → Database → Connection string | 비밀번호 포함 |

### MongoDB Atlas 상태 (2026-02-20 리셋 완료)
- ✅ 클러스터: `kidsmap.wdmgq0i.mongodb.net`
- ✅ DB: `dotori` (11개 컬렉션, 21개 커스텀 인덱스)
- ✅ 유저: `sihu2129_db_user` (atlasAdmin@admin)
- ✅ 시설 496건 + 게시물 8건 + 설정 10건 시드 완료

### MongoDB Atlas 체크리스트
- [ ] **🔴 비밀번호 재설정 필요** — 현재 `bad auth : authentication failed` 오류
  1. [cloud.mongodb.com](https://cloud.mongodb.com) 접속
  2. 좌측 메뉴 → **Database Access** 클릭
  3. 유저 `sihu2129_db_user` 찾아서 **Edit** 클릭
  4. **Edit Password** → 새 비밀번호 생성 (Auto Generate 추천)
  5. `.env.local`의 `MONGODB_URI`에 새 비밀번호 반영
  6. `npx tsx --env-file=.env.local scripts/test-db.ts`로 연결 재확인
- [ ] IP 화이트리스트: `0.0.0.0/0` (개발) → 프로덕션 시 Vercel IP만
- [ ] DB 유저 `sihu2129_db_user` 권한: `readWrite` on `dotori`
- [ ] Atlas 요금제 한도 확인 (M0 Free → 512MB)

---

## 6. 캐시

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `REDIS_URL` | Redis | 🔒 미사용 | — | Upstash/Railway 프로비전 | 코드에서 미구현 |

---

## 7. 지도

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox | 🔒 미사용 | 없음 | [mapbox.com](https://account.mapbox.com) → Access tokens | 코드에서 미구현 |

---

## 8. 외부 공공 데이터

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `PUBLIC_DATA_API_KEY` | data.go.kr | 🔒 미사용 | **발급일+2년** | [data.go.kr](https://www.data.go.kr) → 마이페이지 → 인증키 | 어린이집 정보공개 API |
| `DATA_GO_KR_KEY` | data.go.kr | 🔒 중복 | — | = PUBLIC_DATA_API_KEY | 하나로 통합 권장 |
| `YOUTUBE_API_KEY` | YouTube Data v3 | 🔒 미사용 | 없음 (쿼터 제한) | [console.cloud.google.com](https://console.cloud.google.com) → Credentials | 일 10,000 쿼터 |

### 공공데이터 API 검증
```bash
# data.go.kr 키 유효성 확인
curl -s "http://api.data.go.kr/openapi/tn_pubr_public_child_care_center_api?serviceKey=${PUBLIC_DATA_API_KEY}&pageNo=1&numOfRows=1&type=json" | head -100
# → resultCode "00"이면 유효
```

---

## 9. 결제

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `TOSS_SECRET_KEY` | 토스페이먼츠 | ❌ 플레이스홀더 | — | [developers.tosspayments.com](https://developers.tosspayments.com) | `test_sk_xxxxxxxx` — 실제 키 아님 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스페이먼츠 | ❌ 플레이스홀더 | — | 같은 대시보드 | `test_ck_xxxxxxxx` — 실제 키 아님 |

---

## 10. 모니터링

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | 🔒 미사용 | 없음 | [sentry.io](https://sentry.io) → Project → Client Keys | SDK 미설치 |
| `SENTRY_AUTH_TOKEN` | Sentry CLI | 🔒 미사용 | 없음 | Organization → Auth Tokens | 소스맵 업로드용 |
| `CODECOV_TOKEN` | Codecov | 🔒 미사용 | 없음 | [codecov.io](https://codecov.io) → Settings | 커버리지 리포트용 |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 | 💤 비어있음 | 없음 | [analytics.google.com](https://analytics.google.com) → Admin → Data Streams | 코드 준비됨, ID만 입력하면 활성화 |

---

## 11. 배포

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `VERCEL_TOKEN` | Vercel CLI | ⚠️ 만료 주의 | **토큰 유효기간 확인 필요** | [vercel.com](https://vercel.com/account/tokens) | CLI 배포용 |
| `NEXT_PUBLIC_APP_URL` | 앱 URL | ✅ 정상 | — | 수동 변경 | 프로덕션: `https://dotori.app` |

---

## 12. 보안

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `CRON_SECRET` | Cron 인증 | ⚠️ 개발용 | 없음 | `openssl rand -hex 32` | **프로덕션 전 반드시 변경** |

---

## 13. 카카오 알림톡 (Phase 3)

| 키 | 서비스 | 상태 | 만료 | 재발급 방법 | 비고 |
|----|--------|------|------|-------------|------|
| `SOLAPI_API_KEY` | 솔라피 | 💤 미발급 | — | [solapi.com](https://solapi.com) → 대시보드 | Phase 3 |
| `SOLAPI_API_SECRET` | 솔라피 | 💤 미발급 | — | 같은 대시보드 | Phase 3 |
| `KAKAO_SENDER_KEY` | 카카오 발신 키 | 💤 미발급 | — | [business.kakao.com](https://business.kakao.com) → 알림톡 | 사업자 인증 필요 |
| `SENDER_PHONE` | 발신 번호 | 💤 미입력 | — | 솔라피 발신번호 등록 | 본인인증 필요 |
| `ALIMTALK_TEMPLATE_*` (4개) | 템플릿 ID | 💤 미발급 | — | 카카오 비즈니스 → 템플릿 심사 | 심사 1~3일 소요 |

---

## 중복 키 정리 권장사항

| 중복 그룹 | 현재 | 통합 대상 |
|-----------|------|-----------|
| `AUTH_SECRET` = `NEXTAUTH_SECRET` | 2개 | → `AUTH_SECRET`만 유지 |
| `NEXT_PUBLIC_KAKAO_KEY` = `NEXT_PUBLIC_KAKAO_JS_KEY` | 2개 | → `NEXT_PUBLIC_KAKAO_JS_KEY`만 유지 |
| `KAKAO_CLIENT_ID` = `AUTH_KAKAO_ID` = `KAKAO_REST_API_KEY` | 3개 | → `AUTH_KAKAO_ID`만 유지 |
| `KAKAO_CLIENT_SECRET` = `AUTH_KAKAO_SECRET` | 2개 | → `AUTH_KAKAO_SECRET`만 유지 |
| `PUBLIC_DATA_API_KEY` = `DATA_GO_KR_KEY` | 2개 | → `PUBLIC_DATA_API_KEY`만 유지 |

---

## 프로덕션 배포 전 필수 변경 목록

```
[ ] AUTH_SECRET → openssl rand -base64 32 로 재생성
[ ] CRON_SECRET → openssl rand -hex 32 로 재생성
[ ] NEXT_PUBLIC_APP_URL → https://dotori.app
[ ] NEXT_PUBLIC_SITE_URL → https://dotori.app
[ ] NEXTAUTH_URL → https://dotori.app
[ ] MongoDB IP 화이트리스트 → Vercel IP만 허용
[ ] GITHUB_TOKEN 만료일 확인 + 갱신
[ ] VERCEL_TOKEN 유효성 확인
[ ] 카카오 Redirect URI에 프로덕션 도메인 추가
[ ] OPENAI_API_KEY → 실제 키로 교체 (Phase 2)
[ ] TOSS 키 → 실제 라이브 키로 교체 (결제 활성화 시)
[ ] NEXT_PUBLIC_GA_ID → GA4 측정 ID 입력
```

---

## 자동 검증 스크립트

```bash
#!/bin/bash
# scripts/check-env-keys.sh — 환경변수 유효성 빠른 체크

echo "=== 도토리 환경변수 상태 체크 ==="

# MongoDB Atlas
echo -n "MongoDB Atlas... "
if mongosh "$MONGODB_URI" --eval "db.stats()" --quiet 2>/dev/null | grep -q "ok"; then
  echo "✅ 연결 성공"
else
  echo "❌ 연결 실패 — MONGODB_URI 확인 필요"
fi

# Anthropic API
echo -n "Anthropic API... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-opus-4-6","max_tokens":1,"messages":[{"role":"user","content":"ping"}]}')
if [ "$STATUS" = "200" ]; then echo "✅ 유효"; else echo "❌ HTTP $STATUS — 키 재발급 필요"; fi

# GitHub Token
echo -n "GitHub Token... "
GH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user)
if [ "$GH_STATUS" = "200" ]; then echo "✅ 유효"; else echo "❌ HTTP $GH_STATUS — 토큰 재발급 필요"; fi

# Kakao OAuth
echo -n "Kakao REST API... "
KAKAO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://dapi.kakao.com/v2/search/web?query=test" \
  -H "Authorization: KakaoAK $AUTH_KAKAO_ID")
if [ "$KAKAO_STATUS" = "200" ]; then echo "✅ 유효"; else echo "❌ HTTP $KAKAO_STATUS — 키 확인 필요"; fi

echo "=== 체크 완료 ==="
```

---

*이 문서는 테스트 사이클마다 자동 업데이트됩니다.*
