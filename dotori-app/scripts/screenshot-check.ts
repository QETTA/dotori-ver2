import { chromium, firefox } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

type WaitUntilEvent = 'networkidle' | 'load' | 'domcontentloaded'
type BrowserError = {
  route: string
  type: string
  message: string
}
type VisualMetrics = {
  mean: number
  stdDev: number
  edgeDensity: number
  contrastRange: number
  darkRatio: number
}
type CapturePhase = {
  name: string
  waitMs: number
  minStdDev: number
  minEdgeDensity: number
  minContrastRange: number
  minDarkRatio: number
  enforce: boolean
}
type VisualIssue = {
  route: string
  phase: string
  severity: 'warn' | 'error'
  message: string
}
type RouteCaptureFailure = {
  route: string
  routeName: string
  attempts: number
  message: string
}
type RouteTarget = {
  path: string
  key: string
  waitUntil?: WaitUntilEvent
}
type RouteEntry = RouteTarget & {
  name: string
}

const BASE = process.env.BASE_URL ?? 'http://localhost:3002'
const OUT = '/tmp/dotori-screenshots'
const IGNORE_RUNTIME_NOISE = process.env.CHECK_CONSOLE_IGNORE_API_ERRORS === '1'
const IGNORE_TRANSIENT_NETWORK_ERRORS =
  process.env.CHECK_CONSOLE_IGNORE_TRANSIENT_NETWORK_ERRORS !== '0'
const ROUTE_LIMIT = readInt('SCREENSHOT_ROUTE_LIMIT', 60, 10, 200)
const FACILITY_SAMPLE = readInt('SCREENSHOT_FACILITY_SAMPLE', 40, 10, 160)
const COMMUNITY_SAMPLE = readInt('SCREENSHOT_COMMUNITY_SAMPLE', 18, 6, 120)
const WAITLIST_SAMPLE = readInt('SCREENSHOT_WAITLIST_SAMPLE', 8, 0, 40)
const NAV_TIMEOUT_MS = readInt('SCREENSHOT_NAV_TIMEOUT_MS', 30000, 4000, 120000)
const NAV_RETRIES = readInt('SCREENSHOT_NAV_RETRIES', 2, 0, 5)
const MAX_ROUTE_FAILURES = readInt('SCREENSHOT_MAX_ROUTE_FAILURES', 0, 0, 60)
const QUALITY_RETRY_COUNT = readInt('SCREENSHOT_QUALITY_RETRY_COUNT', 1, 0, 3)
const QUALITY_RETRY_WAIT_MS = readInt('SCREENSHOT_QUALITY_RETRY_WAIT_MS', 1200, 100, 10000)
const ROUTE_MANIFEST = path.join(OUT, 'routes.json')

const consoleIssues: BrowserError[] = []
const visualIssues: VisualIssue[] = []
const routeCaptureFailures: RouteCaptureFailure[] = []
const capturePhases: CapturePhase[] = [
  {
    name: 'early',
    waitMs: Number(process.env.SCREENSHOT_EARLY_WAIT_MS ?? 120),
    minStdDev: Number(process.env.SCREENSHOT_EARLY_MIN_STDDEV ?? 12),
    minEdgeDensity: Number(process.env.SCREENSHOT_EARLY_MIN_EDGE ?? 0.02),
    minContrastRange: Number(process.env.SCREENSHOT_EARLY_MIN_RANGE ?? 26),
    minDarkRatio: Number(process.env.SCREENSHOT_EARLY_MIN_DARK_RATIO ?? 0.02),
    enforce: process.env.SCREENSHOT_ENFORCE_EARLY === '1',
  },
  {
    name: 'settled',
    waitMs: Number(process.env.SCREENSHOT_SETTLED_WAIT_MS ?? 2000),
    minStdDev: Number(process.env.SCREENSHOT_SETTLED_MIN_STDDEV ?? 16),
    minEdgeDensity: Number(process.env.SCREENSHOT_SETTLED_MIN_EDGE ?? 0.08),
    minContrastRange: Number(process.env.SCREENSHOT_SETTLED_MIN_RANGE ?? 36),
    minDarkRatio: Number(process.env.SCREENSHOT_SETTLED_MIN_DARK_RATIO ?? 0.03),
    enforce: true,
  },
]

function readInt(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.floor(value)))
}

function isObjectId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value)
}

function toObjectId(seed: number): string {
  return seed.toString(16).padStart(24, '0').slice(-24)
}

function toFixed(value: number): string {
  return value.toFixed(3)
}

function createVisualMessage(metrics: VisualMetrics): string {
  return `mean=${toFixed(metrics.mean)} stdDev=${toFixed(metrics.stdDev)} edge=${toFixed(metrics.edgeDensity)} range=${toFixed(metrics.contrastRange)} dark=${toFixed(metrics.darkRatio)}`
}

function recordIssue(route: string, type: string, message: string) {
  if (isKnownRuntimeNoise(type, message)) return
  consoleIssues.push({ route, type, message })
}

function evaluateVisualQuality(metrics: VisualMetrics, phase: CapturePhase): string | null {
  if (metrics.stdDev < phase.minStdDev && metrics.edgeDensity < phase.minEdgeDensity) {
    return `low-detail frame (${createVisualMessage(metrics)})`
  }
  if (
    metrics.contrastRange < phase.minContrastRange &&
    metrics.darkRatio < phase.minDarkRatio
  ) {
    return `low-contrast washout (${createVisualMessage(metrics)})`
  }
  if (metrics.mean > 246 && metrics.stdDev < phase.minStdDev + 1.5) {
    return `over-bright washout (${createVisualMessage(metrics)})`
  }
  return null
}

function findPercentileFromHistogram(
  histogram: number[],
  total: number,
  percentile: number,
): number {
  if (total <= 0) return 0
  const clampedPercentile = Math.min(1, Math.max(0, percentile))
  const threshold = total * clampedPercentile
  let cumulative = 0
  for (let i = 0; i < histogram.length; i += 1) {
    cumulative += histogram[i]
    if (cumulative >= threshold) return i
  }
  return histogram.length - 1
}

function getWaitUntil(route: RouteTarget): WaitUntilEvent {
  return route.waitUntil ?? 'networkidle'
}

function getNavigationWaitPlan(route: RouteTarget): WaitUntilEvent[] {
  const preferred = getWaitUntil(route)
  const fallbackOrder: WaitUntilEvent[] =
    preferred === 'networkidle'
      ? ['domcontentloaded', 'load']
      : preferred === 'load'
        ? ['domcontentloaded', 'networkidle']
        : ['load', 'networkidle']
  return [...new Set([preferred, ...fallbackOrder])]
}

async function navigateWithRetry(
  page: { goto: (url: string, options: { waitUntil: WaitUntilEvent; timeout: number }) => Promise<unknown> },
  route: RouteEntry,
): Promise<number> {
  const waitPlan = getNavigationWaitPlan(route)
  const totalAttempts = Math.max(1, NAV_RETRIES + 1)
  let lastMessage = 'unknown navigation error'

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    const waitUntil = waitPlan[Math.min(attempt - 1, waitPlan.length - 1)]
    try {
      await page.goto(`${BASE}${route.path}`, {
        waitUntil,
        timeout: NAV_TIMEOUT_MS,
      })
      if (attempt > 1) {
        console.log(
          `↺ ${route.name} recovered on attempt ${attempt}/${totalAttempts} (waitUntil=${waitUntil})`,
        )
      }
      return attempt
    } catch (error: unknown) {
      lastMessage = error instanceof Error ? error.message : String(error)
      console.log(
        `⚠️ ${route.name} nav attempt ${attempt}/${totalAttempts} failed (waitUntil=${waitUntil}): ${lastMessage}`,
      )
    }
  }

  throw new Error(lastMessage)
}

function isKnownRuntimeNoise(type: string, message: string): boolean {
  const normalized = message.toLowerCase()

  if (
    normalized.includes(
      'download the react devtools for a better development experience',
    )
  ) {
    return true
  }

  if (
    normalized.includes(
      "a tree hydrated but some attributes of the server rendered html didn't match",
    )
  ) {
    return true
  }

  if (
    normalized.includes(
      'failed to load resource: the server responded with a status of 401',
    ) &&
    normalized.includes('unauthorized')
  ) {
    return true
  }

  if (
    IGNORE_TRANSIENT_NETWORK_ERRORS &&
    (normalized.includes('net::err_network_changed') ||
      (normalized.includes('clientfetcherror') &&
        normalized.includes('failed to fetch') &&
        normalized.includes('errors.authjs.dev#autherror')))
  ) {
    return true
  }

  if (!IGNORE_RUNTIME_NOISE) return false

  if (
    normalized.includes('clientfetcherror') &&
    normalized.includes('not valid json')
  ) {
    return true
  }

  if (
    normalized.includes(
      'failed to load resource: the server responded with a status of 500',
    )
  ) {
    return true
  }

  if (
    type === 'pageerror' &&
    normalized.includes('환경변수 오류:') &&
    normalized.includes('invalid input: expected string')
  ) {
    return true
  }

  return false
}

async function analyzeScreenshot(filePath: string): Promise<VisualMetrics> {
  const width = 96
  const height = 208
  const { data } = await sharp(filePath)
    .resize(width, height, { fit: 'cover' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let sum = 0
  let sumSquared = 0
  let darkPixels = 0
  const histogram = new Array<number>(256).fill(0)
  for (const value of data) {
    sum += value
    sumSquared += value * value
    histogram[value] += 1
    if (value <= 112) darkPixels += 1
  }
  const pixelCount = data.length
  const mean = sum / pixelCount
  const variance = Math.max(0, sumSquared / pixelCount - mean * mean)
  const stdDev = Math.sqrt(variance)

  let edgePixels = 0
  let edgeTotal = 0
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x
      const gx =
        -data[i - width - 1] -
        2 * data[i - 1] -
        data[i + width - 1] +
        data[i - width + 1] +
        2 * data[i + 1] +
        data[i + width + 1]
      const gy =
        -data[i - width - 1] -
        2 * data[i - width] -
        data[i - width + 1] +
        data[i + width - 1] +
        2 * data[i + width] +
        data[i + width + 1]
      const magnitude = Math.abs(gx) + Math.abs(gy)
      if (magnitude > 120) edgePixels += 1
      edgeTotal += 1
    }
  }

  const p05 = findPercentileFromHistogram(histogram, pixelCount, 0.05)
  const p95 = findPercentileFromHistogram(histogram, pixelCount, 0.95)

  return {
    mean,
    stdDev,
    edgeDensity: edgeTotal > 0 ? edgePixels / edgeTotal : 0,
    contrastRange: p95 - p05,
    darkRatio: pixelCount > 0 ? darkPixels / pixelCount : 0,
  }
}

async function fetchJson(endpoint: string): Promise<unknown | null> {
  try {
    const response = await fetch(`${BASE}${endpoint}`, {
      signal: AbortSignal.timeout(8000),
      headers: { accept: 'application/json' },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function extractId(record: unknown): string | null {
  if (!record || typeof record !== 'object') return null
  const item = record as Record<string, unknown>
  const idCandidates = [item.id, item._id]
  for (const candidate of idCandidates) {
    if (typeof candidate === 'string' && isObjectId(candidate)) {
      return candidate
    }
  }
  return null
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

function parseIdList(payload: unknown, fallbackMax: number): string[] {
  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  const source = Array.isArray(root.data)
    ? root.data
    : Array.isArray(payload)
      ? (payload as unknown[])
      : []

  const ids: string[] = []
  for (const row of source) {
    const id = extractId(row)
    if (id) ids.push(id)
    if (ids.length >= fallbackMax) break
  }
  return uniqueIds(ids)
}

async function getFacilityIds(limit: number): Promise<string[]> {
  const ids: string[] = []
  const pageSize = Math.min(50, Math.max(20, limit))

  for (let page = 1; page <= 4 && ids.length < limit; page += 1) {
    const payload = await fetchJson(`/api/facilities?page=${page}&limit=${pageSize}`)
    ids.push(...parseIdList(payload, limit - ids.length))
    const totalPages = Number(
      (payload as Record<string, unknown> | null)?.pagination &&
        typeof (payload as Record<string, unknown>).pagination === 'object'
        ? ((payload as { pagination?: { totalPages?: unknown } }).pagination?.totalPages ?? 1)
        : 1,
    )
    if (Number.isFinite(totalPages) && page >= totalPages) break
  }

  const unique = uniqueIds(ids).slice(0, limit)
  if (unique.length >= limit) return unique

  const fallback: string[] = []
  for (let i = 1; fallback.length + unique.length < limit; i += 1) {
    fallback.push(toObjectId(0x1000 + i))
  }
  return unique.concat(fallback)
}

async function getCommunityPostIds(limit: number): Promise<string[]> {
  const payload =
    (await fetchJson(`/api/community/posts?page=1&limit=${Math.min(60, limit)}&sort=createdAt`)) ??
    (await fetchJson(`/api/community/posts?limit=${Math.min(60, limit)}`))

  const ids = parseIdList(payload, limit)
  if (ids.length >= limit) return ids.slice(0, limit)

  const fallback: string[] = []
  for (let i = 1; fallback.length + ids.length < limit; i += 1) {
    fallback.push(toObjectId(0x2000 + i))
  }
  return ids.concat(fallback)
}

async function getWaitlistIds(limit: number): Promise<string[]> {
  if (limit <= 0) return []

  const payload = await fetchJson('/api/waitlist')
  return parseIdList(payload, limit).slice(0, limit)
}

function buildCoreRoutes(): RouteTarget[] {
  return [
    { key: 'home', path: '/' },
    { key: 'chat', path: '/chat' },
    { key: 'chat-chip-move', path: '/chat?prompt=반편성%20불만' },
    { key: 'chat-chip-teacher', path: '/chat?prompt=교사%20교체' },
    { key: 'explore', path: '/explore', waitUntil: 'load' },
    { key: 'explore-available', path: '/explore?status=available', waitUntil: 'load' },
    { key: 'explore-waiting', path: '/explore?status=waiting', waitUntil: 'load' },
    { key: 'explore-q-national', path: '/explore?q=국공립', waitUntil: 'load' },
    { key: 'community', path: '/community', waitUntil: 'load' },
    { key: 'community-question', path: '/community?category=question', waitUntil: 'load' },
    { key: 'community-info', path: '/community?category=info', waitUntil: 'load' },
    { key: 'community-write', path: '/community/write', waitUntil: 'load' },
    { key: 'my', path: '/my' },
    { key: 'my-settings', path: '/my/settings' },
    { key: 'my-notifications', path: '/my/notifications' },
    { key: 'my-interests', path: '/my/interests' },
    { key: 'my-waitlist', path: '/my/waitlist' },
    { key: 'my-import', path: '/my/import' },
    { key: 'my-support', path: '/my/support' },
    { key: 'my-app-info', path: '/my/app-info' },
    { key: 'my-notices', path: '/my/notices' },
    { key: 'my-terms', path: '/my/terms' },
    { key: 'landing', path: '/landing' },
    { key: 'login', path: '/login' },
    { key: 'onboarding', path: '/onboarding', waitUntil: 'domcontentloaded' },
  ]
}

function buildRoutePlan(
  facilityIds: string[],
  communityIds: string[],
  waitlistIds: string[],
): RouteEntry[] {
  const core = buildCoreRoutes()
  const mixed: RouteTarget[] = [...core]

  const facilityPriority = facilityIds.slice(0, 18)
  facilityPriority.forEach((id, index) => {
    mixed.push({ key: `facility-${String(index + 1).padStart(2, '0')}`, path: `/facility/${id}` })
  })

  const communityPriority = communityIds.slice(0, 12)
  communityPriority.forEach((id, index) => {
    mixed.push({
      key: `community-detail-${String(index + 1).padStart(2, '0')}`,
      path: `/community/${id}`,
    })
  })

  const waitlistPriority = waitlistIds.slice(0, 6)
  waitlistPriority.forEach((id, index) => {
    mixed.push({
      key: `waitlist-detail-${String(index + 1).padStart(2, '0')}`,
      path: `/my/waitlist/${id}`,
    })
  })

  const extraFacilities = facilityIds.slice(18)
  extraFacilities.forEach((id, index) => {
    mixed.push({
      key: `facility-extra-${String(index + 1).padStart(2, '0')}`,
      path: `/facility/${id}?from=vision${index + 1}`,
    })
  })

  const extraCommunity = communityIds.slice(12)
  extraCommunity.forEach((id, index) => {
    mixed.push({
      key: `community-extra-${String(index + 1).padStart(2, '0')}`,
      path: `/community/${id}?from=vision${index + 1}`,
    })
  })

  const extraWaitlists = waitlistIds.slice(6)
  extraWaitlists.forEach((id, index) => {
    mixed.push({
      key: `waitlist-extra-${String(index + 1).padStart(2, '0')}`,
      path: `/my/waitlist/${id}?from=vision${index + 1}`,
    })
  })

  const seen = new Set<string>()
  const unique = mixed.filter((route) => {
    if (seen.has(route.path)) return false
    seen.add(route.path)
    return true
  })

  return unique.slice(0, ROUTE_LIMIT).map((route, index) => ({
    ...route,
    name: `${String(index + 1).padStart(3, '0')}-${route.key}`,
  }))
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const [facilityIds, communityIds, waitlistIds] = await Promise.all([
    getFacilityIds(FACILITY_SAMPLE),
    getCommunityPostIds(COMMUNITY_SAMPLE),
    getWaitlistIds(WAITLIST_SAMPLE),
  ])
  const routes = buildRoutePlan(facilityIds, communityIds, waitlistIds)
  await fs.promises.writeFile(
    ROUTE_MANIFEST,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        routeLimit: ROUTE_LIMIT,
        facilitySample: FACILITY_SAMPLE,
        communitySample: COMMUNITY_SAMPLE,
        waitlistSample: WAITLIST_SAMPLE,
        count: routes.length,
        routes,
      },
      null,
      2,
    ),
    'utf-8',
  )

  const browserType = process.env.BROWSER === 'firefox' ? firefox : chromium
  const browser = await browserType.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  })
  await context.addCookies([
    {
      name: 'dotori_prehome_splash',
      value: '1',
      url: BASE,
    },
  ])

  console.log(`Route manifest: ${ROUTE_MANIFEST}`)
  console.log(`Routes planned: ${routes.length}`)
  console.log(
    `Navigation guard: retries=${NAV_RETRIES} timeoutMs=${NAV_TIMEOUT_MS} maxFailures=${MAX_ROUTE_FAILURES}`,
  )
  console.log(
    `Visual retry guard: retries=${QUALITY_RETRY_COUNT} waitMs=${QUALITY_RETRY_WAIT_MS}`,
  )

  for (const route of routes) {
    const page = await context.newPage()
    const routeName = route.name
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = `[${routeName}] console.${msg.type()}: ${msg.text()}`
        const beforeCount = consoleIssues.length
        recordIssue(route.path, msg.type(), text)
        if (consoleIssues.length > beforeCount) {
          console.log(text)
        }
      }
    })
    page.on('pageerror', (error) => {
      const text = `[${routeName}] pageerror: ${error.message}`
      const beforeCount = consoleIssues.length
      recordIssue(route.path, 'pageerror', text)
      if (consoleIssues.length > beforeCount) {
        console.log(text)
      }
    })

    try {
      await navigateWithRetry(page, route)

      let elapsed = 0
      for (const phase of capturePhases) {
        const waitDelta = Math.max(0, phase.waitMs - elapsed)
        if (waitDelta > 0) await page.waitForTimeout(waitDelta)
        elapsed = phase.waitMs

        const screenshotPath = path.join(OUT, `${route.name}-${phase.name}.png`)
        const totalQualityAttempts = QUALITY_RETRY_COUNT + 1
        let qualityAttempt = 1
        let metrics: VisualMetrics | null = null
        let qualityIssue: string | null = null

        for (; qualityAttempt <= totalQualityAttempts; qualityAttempt += 1) {
          await page.screenshot({ path: screenshotPath, fullPage: true })
          if (phase.name === 'settled') {
            await fs.promises.copyFile(screenshotPath, path.join(OUT, `${route.name}.png`))
          }

          metrics = await analyzeScreenshot(screenshotPath)
          qualityIssue = evaluateVisualQuality(metrics, phase)
          if (!qualityIssue) break

          if (qualityAttempt < totalQualityAttempts) {
            console.log(
              `↺ ${route.name}:${phase.name} quality retry ${qualityAttempt}/${QUALITY_RETRY_COUNT} (${qualityIssue})`,
            )
            await page.waitForTimeout(QUALITY_RETRY_WAIT_MS)
          }
        }

        if (!metrics) {
          throw new Error(`metrics not produced for ${route.name}:${phase.name}`)
        }

        const visualMessage = createVisualMessage(metrics)
        if (qualityIssue) {
          visualIssues.push({
            route: route.path,
            phase: phase.name,
            severity: phase.enforce ? 'error' : 'warn',
            message: `[${routeName}] ${phase.name}: ${qualityIssue}`,
          })
        }
        const qualityRetryUsed = Math.max(0, qualityAttempt - 1)
        console.log(
          `📸 ${route.name}:${phase.name} → ${route.path} (${visualMessage}; qualityRetries=${qualityRetryUsed})`,
        )
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      routeCaptureFailures.push({
        route: route.path,
        routeName: route.name,
        attempts: NAV_RETRIES + 1,
        message,
      })
      console.log(`❌ ${route.name} — ${message}`)
    }

    await page.close()
  }

  await browser.close()

  if (routeCaptureFailures.length > 0) {
    console.log(`\n라우트 캡처 실패: ${routeCaptureFailures.length}건`)
    for (const failure of routeCaptureFailures.slice(0, 20)) {
      console.log(
        `[${failure.routeName}] ${failure.route} (${failure.attempts} attempts) — ${failure.message}`,
      )
    }
    if (routeCaptureFailures.length > 20) {
      console.log(`... +${routeCaptureFailures.length - 20}건 더 있음`)
    }
    if (routeCaptureFailures.length > MAX_ROUTE_FAILURES) {
      process.exitCode = 1
    }
  }

  if (consoleIssues.length > 0) {
    console.log(`\n브라우저 콘솔 이슈: ${consoleIssues.length}건`)
    for (const item of consoleIssues.slice(0, 20)) {
      console.log(item.message)
    }
    if (consoleIssues.length > 20) {
      console.log(`... +${consoleIssues.length - 20}건 더 있음`)
    }
    process.exitCode = 1
  }

  if (visualIssues.length > 0) {
    const errors = visualIssues.filter((issue) => issue.severity === 'error')
    console.log(`\n시각 품질 이슈: ${visualIssues.length}건 (error=${errors.length})`)
    for (const issue of visualIssues.slice(0, 20)) {
      console.log(`${issue.severity.toUpperCase()} ${issue.message}`)
    }
    if (visualIssues.length > 20) {
      console.log(`... +${visualIssues.length - 20}건 더 있음`)
    }
    if (errors.length > 0) {
      process.exitCode = 1
    }
  }

  console.log(`\n스크린샷 저장: ${OUT}/`)
}

main()
