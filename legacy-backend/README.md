# 입소ai — AI 기반 어린이집 입소 확률 분석 플랫폼

> **AI가 찾아주는 우리 아이 어린이집**
> 실시간 TO 알림 · 입소 확률 분석 · 맞춤 전략 상담

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, RSC, Turbopack) |
| Language | TypeScript 5.6 (strict) |
| Styling | Tailwind CSS 4 + CSS custom properties |
| State | Zustand 5 + React Query 5 |
| Database | PostgreSQL + Prisma ORM (14 models) |
| Auth | NextAuth v5 (Kakao, Naver OAuth) |
| Payment | 토스페이먼츠 |
| Map | Kakao Maps SDK |
| AI | OpenAI GPT-4o-mini (SSE streaming) |
| Testing | Vitest + Playwright + Storybook |
| Deploy | Vercel (ICN) + Docker |

## Quick Start

```bash
git clone https://github.com/QETTA/ipsoai.git && cd ipsoai
npm install
cp .env.example .env.local  # fill in keys
npx prisma db push && npm run db:seed
npm run dev  # http://localhost:3000
```

## Scripts

| Script | Description |
|--------|-------------|
| dev | Dev server (Turbopack) |
| build | Production build |
| test | Unit tests (Vitest) |
| test:e2e | E2E tests (Playwright) |
| storybook | Component stories (port 6006) |
| db:push / db:seed / db:studio | Database management |
| validate | typecheck + lint + test |

## Pages (30)

**Marketing**: Landing (RSC), Pricing, About
**Auth**: Login (Kakao/Naver), Onboarding (4-step)
**Consumer**: Explore, Facility Detail, Map (Kakao), Compare, Chat (SSE), Simulation, Alerts, Notifications, Consult, Report, Payment, Favorites, Mypage, Settings (4-tab)
**Admin**: Dashboard (KPIs), Audit Log

## API Routes (12)

auth, facilities, alerts, chat (SSE), simulation, consult, favorites, payment (confirm/cancel/webhook), notifications (SSE stream), cron (daily sync)

## Probability Engine

5-factor calculation: 대기순번(35) + 여유정원(25) + 시즌(15) + 가점(15) + 연령(10) = 0-100점
8 simulation strategies with impact scores

## Metrics

150+ source files · 30 pages · 43 components · 14 DB models · 12 API routes · 70+ tests · i18n (ko/en)

---
© 2025 QETTA. All rights reserved.
