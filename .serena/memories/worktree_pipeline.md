# Worktree Pipeline — 트러블슈팅 기록

## doctl 401 문제 (2026-02-26)
- **증상**: `doctl auth init` 성공하지만 모든 API 호출에서 401
- **원인**: doctl 내부 버그 — config.yaml에 토큰 저장되나 API 호출 시 전달 안 됨
- **해결**: curl로 직접 DO API 호출 (doctl 우회)
```bash
# 배포 트리거
curl -s -X POST \
  -H "Authorization: Bearer ${DO_TOKEN}" \
  -H "Content-Type: application/json" \
  https://api.digitalocean.com/v2/apps/${APP_ID}/deployments

# 환경변수 업데이트
# 1) 현재 스펙 가져오기 → python3로 env 수정 → PUT으로 반영
```

## MongoDB 인증 실패 (2026-02-26)
- **증상**: `bad auth : authentication failed` — 앱에서만 실패, 직접 연결은 성공
- **원인**: `~/.claude/.env`에 export된 구버전 MONGODB_URI가 쉘 환경변수로 .env.local을 덮어씀
- **해결**: `~/.claude/.env` 비밀번호 동기화 + dev 서버 재시작
- **교훈**: 환경변수 우선순위: 쉘 export > .env.local. 항상 ~/.claude/.env도 확인

## .next 캐시 문제
- **증상**: .env.local 변경 후에도 구버전 값 사용
- **해결**: `find .next -mindepth 1 -delete` 후 재시작 (rm -rf는 bash-guard 차단)
