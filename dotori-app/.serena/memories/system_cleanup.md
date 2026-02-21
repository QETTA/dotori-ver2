# 시스템 청소 규칙 (주기적 실행)

## 좀비 프로세스 정리
```bash
# 죽은 codex 프로세스 정리
pkill -f "codex exec" 2>/dev/null || true

# 오래된 next dev 재시작
pkill -f "next dev" 2>/dev/null || true
sleep 2

# 포트 3000 점유 확인 + 해제
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

## 워크트리 정리 (작업 후 항상 실행)
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
git worktree prune
git branch -d codex/task-A codex/task-B 2>/dev/null || true
rm -rf .worktrees/
```

## 임시 파일 정리
```bash
rm -f /tmp/codex-p*.log /tmp/codex-p*-result.txt
rm -f /tmp/codex-*.md /tmp/wt-*.log
rm -rf /tmp/wt-results/ /tmp/wt-logs/
```

## npm 캐시 정리 (빌드 이상 시)
```bash
cd /home/sihu2129/dotori-ver2/dotori-app
rm -rf .next/
npm run build
```

## MongoDB 임시 스크립트 정리
```bash
rm -f /tmp/*.js
```

## 주기 권고
- 각 워크트리 작업 완료 후: 워크트리 정리
- 세션 종료 전: 임시 파일 정리
- 빌드 에러 시: .next/ 삭제 후 재빌드
