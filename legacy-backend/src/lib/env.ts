/**
 * Environment variable validation
 * Import at app startup to catch missing vars early
 */

interface EnvConfig {
  /** Required in all environments */
  required: string[]
  /** Required only in production */
  production: string[]
  /** Optional with defaults */
  optional: Record<string, string>
}

const config: EnvConfig = {
  required: ['NEXTAUTH_SECRET'],
  production: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_KAKAO_KEY',
    'KAKAO_CLIENT_ID',
    'KAKAO_CLIENT_SECRET',
    'NAVER_CLIENT_ID',
    'NAVER_CLIENT_SECRET',
    'TOSS_SECRET_KEY',
    'NEXT_PUBLIC_TOSS_CLIENT_KEY',
    'DATA_GO_KR_KEY',
    'CRON_SECRET',
  ],
  optional: {
    NODE_ENV: 'development',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    OPENAI_API_KEY: '', // Empty = mock mode
    OPENAI_API_URL: '',
    OPENAI_BASE_URL: '',
    OPENAI_HOST: '',
    OPENAI_MODEL: '',
    OPENAI_TEMPERATURE: '0.55',
    OPENAI_TOP_P: '0.95',
    OPENAI_MAX_TOKENS: '1200',
    OPENAI_EXTRA_BODY: '',
    OPENAI_REQUEST_TIMEOUT_MS: '30000',
    AI_PROVIDER: '',
    AI_BASE_URL: '',
    AI_MODEL: '',
    SPARK_API_KEY: '',
    SPARK_API_URL: '',
    SPARK_API_HOST: '',
    SPARK_BASE_URL: '',
    SPARK_MODEL: '',
    SPARK_TEMPERATURE: '0.35',
    SPARK_TOP_P: '0.9',
    SPARK_MAX_TOKENS: '1800',
    SPARK_REASONING: 'true',
    SPARK_EXTRA_BODY: '',
    SPARK_REQUEST_TIMEOUT_MS: '30000',
    SPARK_SYSTEM_PROMPT: '',
    REDIS_URL: '', // Empty = in-memory rate limiter
    NEXT_PUBLIC_GA_ID: '',
    NEXT_PUBLIC_SENTRY_DSN: '',
    MONGODB_URI: '',
  },
}

function hasEnv(key: string) {
  if (key === 'DATABASE_URL') {
    return !!(process.env.DATABASE_URL?.trim() || process.env.MONGODB_URI?.trim())
  }
  return !!process.env[key]
}

export function validateEnv() {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required vars
  for (const key of config.required) {
    if (!hasEnv(key)) missing.push(key)
  }

  // Check production vars
  if (process.env.NODE_ENV === 'production') {
    for (const key of config.production) {
      if (!hasEnv(key)) missing.push(key)
    }
  } else {
    // Dev warnings for missing production vars
    for (const key of config.production) {
      if (!hasEnv(key)) warnings.push(key)
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(`⚠️  [Env] Missing optional vars (mock/fallback mode): ${warnings.join(', ')}`)
  }

  if (missing.length > 0) {
    const msg = `❌ [Env] Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n\nCopy .env.example to .env.local and fill in values.`
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    }
    console.error(msg)
  }

  return { missing, warnings, valid: missing.length === 0 }
}

/** Helper to get env with fallback */
export function env(key: string, fallback?: string): string {
  return process.env[key] ?? config.optional[key] ?? fallback ?? ''
}

/** Check if a feature is available based on env */
export const features = {
  get database() {
    return !!(process.env.DATABASE_URL || process.env.MONGODB_URI)
  },
  get redis() {
    return !!process.env.REDIS_URL
  },
  get openai() {
    const provider = (process.env.AI_PROVIDER ?? '').toLowerCase()
    if (provider === 'mock') return false
    if (provider === 'openai') return !!process.env.OPENAI_API_KEY
    if (provider === 'spark') return !!process.env.SPARK_API_KEY
    return !!process.env.OPENAI_API_KEY || !!process.env.SPARK_API_KEY
  },
  get kakaoMap() {
    return !!(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || process.env.NEXT_PUBLIC_KAKAO_KEY)
  },
  get tossPayment() {
    return !!process.env.TOSS_SECRET_KEY
  },
  get analytics() {
    return !!process.env.NEXT_PUBLIC_GA_ID
  },
  get sentry() {
    return !!process.env.NEXT_PUBLIC_SENTRY_DSN
  },
  get publicData() {
    return !!process.env.DATA_GO_KR_KEY
  },
}
