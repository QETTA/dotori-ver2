# ── Dotori App — Multi-stage Docker Build ──
# 빌드 컨텍스트: repo root (app.yaml의 dockerfile_path: dotori-app/Dockerfile)
# 모든 COPY 경로는 repo root 기준으로 dotori-app/ 접두사 필요
# Ref: https://github.com/nextjs/deploy-digitalocean

FROM node:22-alpine AS base

# ── Stage 1: Install dependencies ──
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY dotori-app/package.json dotori-app/package-lock.json ./
RUN npm ci
# sharp for next/image optimization in standalone mode (alpine = musl)
RUN npm install --os=linux --libc=musl --cpu=x64 sharp

# ── Stage 2: Build the application ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY dotori-app/ .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
RUN npm run build

# ── Stage 3: Production runner ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output + static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
