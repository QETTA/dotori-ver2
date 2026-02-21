import { defineConfig, devices } from '@playwright/test'

const E2E_BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const USE_EXTERNAL_SERVER = process.env.PLAYWRIGHT_EXTERNAL_SERVER === '1'

const baseUrl = new URL(E2E_BASE_URL)
const baseHostname = baseUrl.hostname || 'localhost'
const basePort = baseUrl.port || '3000'

const config = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
  },

  projects: [
    { name: 'MobileChrome', use: { ...devices['Pixel 7'] } },
  ],
})

if (!USE_EXTERNAL_SERVER) {
  config.webServer = {
    command: `npm run dev -- --port ${basePort} --hostname ${baseHostname}`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AI_PROVIDER: 'mock',
      NEXT_PUBLIC_E2E_DISABLE_EXTERNAL_SDK: '1',
    },
  }
}

export default config
