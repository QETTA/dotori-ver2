#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const repeat = Number.parseInt(process.env.REPEAT ?? '5', 10)
if (!Number.isFinite(repeat) || repeat < 1) {
  console.error('REPEAT must be a positive integer')
  process.exit(1)
}

for (let i = 1; i <= repeat; i += 1) {
  console.log(`\n[flaky-check] engine run ${i}/${repeat}`)
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vitest', 'run', 'src/lib/engine/__tests__'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        NO_COLOR: '1',
      },
    },
  )

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log(`\n[flaky-check] passed ${repeat}/${repeat} runs`)
