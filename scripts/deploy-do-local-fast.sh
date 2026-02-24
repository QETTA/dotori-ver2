#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$REPO_ROOT/dotori-app"

APP_ID="${DOTORI_APP_ID:-${DO_APP_ID:-29a6e4f6-b8ae-48b7-9ae3-3e3275b274c2}}"
DOCTL_BIN="${DOCTL_BIN:-$HOME/.local/bin/doctl}"
DOCTL_TOKEN="${DOCTL_ACCESS_TOKEN:-${DIGITALOCEAN_ACCESS_TOKEN:-${DO_TOKEN:-}}}"
DOCR_REGISTRY="${DOCR_REGISTRY:-dotori}"
DOCR_REPOSITORY="${DOCR_REPOSITORY:-web}"
DEEP_HEALTH="${DEEP_HEALTH:-1}"
DEEP_HEALTH_TRIES="${DEEP_HEALTH_TRIES:-12}"

if [ ! -x "$DOCTL_BIN" ]; then
  if command -v doctl >/dev/null 2>&1; then
    DOCTL_BIN="$(command -v doctl)"
  else
    echo "ERROR: doctl not found. Install doctl first." >&2
    exit 1
  fi
fi

DOCTL_ARGS=()
if [ -n "$DOCTL_TOKEN" ]; then
  DOCTL_ARGS+=(--access-token "$DOCTL_TOKEN")
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker not found. Install Docker first." >&2
  exit 1
fi

if docker info >/dev/null 2>&1; then
  docker_cmd() { docker "$@"; }
elif sudo DOCKER_CONFIG="$HOME/.docker" docker info >/dev/null 2>&1; then
  docker_cmd() { sudo DOCKER_CONFIG="$HOME/.docker" docker "$@"; }
else
  echo "ERROR: Docker daemon is not available." >&2
  exit 1
fi

if [ "${SKIP_PRECHECK:-0}" != "1" ]; then
  PRECHECK_CMD="${PRECHECK_CMD:-npm run ci:preflight}"
  echo "▶ precheck: $PRECHECK_CMD"
  (cd "$APP_DIR" && eval "$PRECHECK_CMD")
fi

STAMP="$(date -u +%Y%m%d%H%M%S)"
SHORT_SHA="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "nogit")"
IMAGE_TAG="${IMAGE_TAG:-local-${STAMP}-${SHORT_SHA}}"
IMAGE_URI="registry.digitalocean.com/${DOCR_REGISTRY}/${DOCR_REPOSITORY}:${IMAGE_TAG}"
LATEST_URI="registry.digitalocean.com/${DOCR_REGISTRY}/${DOCR_REPOSITORY}:latest"

echo "▶ login DOCR"
"$DOCTL_BIN" "${DOCTL_ARGS[@]}" registry login --expiry-seconds 1800 >/dev/null

echo "▶ build image: $IMAGE_URI"
docker_cmd build \
  -f "$APP_DIR/Dockerfile" \
  --build-arg SKIP_ENV_VALIDATION=1 \
  -t "$IMAGE_URI" \
  "$REPO_ROOT"

echo "▶ push image tag: $IMAGE_TAG"
docker_cmd push "$IMAGE_URI"

if [ "${PUSH_LATEST:-1}" = "1" ]; then
  echo "▶ push image tag: latest"
  docker_cmd tag "$IMAGE_URI" "$LATEST_URI"
  docker_cmd push "$LATEST_URI"
fi

TMP_SPEC="$(mktemp)"
TMP_PATCHED="$(mktemp)"
trap 'rm -f "$TMP_SPEC" "$TMP_PATCHED"' EXIT

echo "▶ fetch current app spec"
"$DOCTL_BIN" "${DOCTL_ARGS[@]}" apps spec get "$APP_ID" > "$TMP_SPEC"

echo "▶ patch app spec source -> DOCR image tag"
awk -v tag="$IMAGE_TAG" -v repo="$DOCR_REPOSITORY" '
BEGIN {
  patched = 0
  skip_github = 0
  in_image = 0
}
{
  if (skip_github == 1) {
    if ($0 ~ /^    /) next
    skip_github = 0
  }

  if (patched == 0 && $0 ~ /^  dockerfile_path:/) {
    print "  image:"
    print "    registry: dotori"
    print "    registry_type: DOCR"
    print "    repository: " repo
    print "    tag: " tag
    patched = 1
    next
  }

  if (patched == 0 && $0 ~ /^  image:$/) {
    in_image = 1
    print
    next
  }

  if ($0 ~ /^  github:$/) {
    skip_github = 1
    next
  }

  if (in_image == 1) {
    if ($0 ~ /^    tag:/) {
      print "    tag: " tag
      patched = 1
      in_image = 0
      next
    }
    if ($0 ~ /^  [^ ]/) {
      in_image = 0
    }
  }

  print
}
END {
  if (patched == 0) {
    exit 42
  }
}
' "$TMP_SPEC" > "$TMP_PATCHED" || {
  code=$?
  if [ "$code" -eq 42 ]; then
    echo "ERROR: failed to patch service source in app spec." >&2
  fi
  exit "$code"
}

echo "▶ update app and deploy"
"$DOCTL_BIN" "${DOCTL_ARGS[@]}" apps update "$APP_ID" --spec "$TMP_PATCHED" --wait >/dev/null

APP_URL="$("$DOCTL_BIN" "${DOCTL_ARGS[@]}" apps get "$APP_ID" --format DefaultIngress --no-header | tr -d "[:space:]")"
if [ -z "$APP_URL" ]; then
  echo "ERROR: failed to resolve app URL." >&2
  exit 1
fi

APP_URL="${APP_URL%/}"
HEALTH_URL="${APP_URL}/api/health"
DEEP_HEALTH_URL="${APP_URL}/api/health/deep"

echo "▶ health check: $HEALTH_URL"
for i in $(seq 1 40); do
  if curl -fsS --max-time 6 "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✅ deployed (liveness): $APP_URL"
    if [ "$DEEP_HEALTH" != "1" ]; then
      echo "✅ deep health skipped"
      echo "   image: $IMAGE_URI"
      exit 0
    fi
    break
  fi
  sleep 3
done

for i in $(seq 1 "$DEEP_HEALTH_TRIES"); do
  if curl -fsS --max-time 8 "$DEEP_HEALTH_URL" >/dev/null 2>&1; then
    echo "✅ deep health OK: $DEEP_HEALTH_URL"
    echo "   image: $IMAGE_URI"
    exit 0
  fi
  sleep 3
done

echo "ERROR: deployment health check timeout ($HEALTH_URL)" >&2
if [ "$DEEP_HEALTH" = "1" ]; then
  echo "ERROR: deep health check timeout ($DEEP_HEALTH_URL)" >&2
fi
exit 2
