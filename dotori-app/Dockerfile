# ── Dotori App — Multi-stage Docker Build (v2) ──
# 빌드 컨텍스트: repo root (app.yaml의 image 참조 or CI docker build)
# 레이어 순서: 변경 빈도 ↑ → 하단 배치 (Docker 캐시 극대화)

FROM node:22-alpine AS base

# ── Stage 1: Dependencies (package.json 변경 시만 재실행) ──
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY dotori-app/package.json dotori-app/package-lock.json ./
RUN npm ci --no-audit --no-fund
RUN npm install --os=linux --libc=musl --cpu=x64 sharp

# ── Stage 2: Build (레이어 캐시 최적화) ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Layer 1: config 파일 (거의 안 바뀜)
COPY dotori-app/package.json dotori-app/tsconfig.json ./
COPY dotori-app/next.config.ts dotori-app/postcss.config.mjs ./
COPY dotori-app/next-env.d.ts* ./

# Layer 2: static assets (가끔 바뀜)
COPY dotori-app/public ./public

# Layer 3: source code (가장 자주 바뀜 → 마지막)
COPY dotori-app/src ./src

# NEXT_PUBLIC_* 빌드타임 주입 (GHA build-args 또는 DO BUILD_TIME envs)
ARG SKIP_ENV_VALIDATION=1
ARG NEXT_PUBLIC_KAKAO_JS_KEY
ARG NEXT_PUBLIC_KAKAO_KEY
ARG NEXT_PUBLIC_KAKAO_MAP_KEY
ARG NEXT_PUBLIC_KAKAO_CHANNEL_ID
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ARG NEXT_PUBLIC_MAPBOX_STYLE
ARG NEXT_PUBLIC_TOSS_CLIENT_KEY
ARG NEXT_PUBLIC_GA_ID

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production runner (minimal image) ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
LABEL org.opencontainers.image.source=https://github.com/QETTA/dotori-ver2

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
