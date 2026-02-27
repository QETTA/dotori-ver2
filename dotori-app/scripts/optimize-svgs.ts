/**
 * SVG 일괄 최적화 스크립트
 *
 * public/brand/*.svg 파일을 SVGO로 최적화.
 * 사용법: npx tsx scripts/optimize-svgs.ts
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { optimize } from 'svgo'

const SVG_DIR = join(process.cwd(), '..', 'brand', 'assets')
const SVG_DIR_FALLBACK = join(process.cwd(), 'public', 'brand')

function getSvgDir(): string {
  try {
    const files = readdirSync(SVG_DIR)
    if (files.some((f) => f.endsWith('.svg'))) return SVG_DIR
  } catch {
    /* ignore */
  }
  try {
    const files = readdirSync(SVG_DIR_FALLBACK)
    if (files.some((f) => f.endsWith('.svg'))) return SVG_DIR_FALLBACK
  } catch {
    /* ignore */
  }
  console.error('❌ SVG 디렉토리를 찾을 수 없습니다:', SVG_DIR, 'or', SVG_DIR_FALLBACK)
  process.exit(1)
}

function main() {
  const dir = getSvgDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.svg'))

  if (files.length === 0) {
    console.log('⚠️ SVG 파일이 없습니다:', dir)
    return
  }

  console.log(`\n🌰 도토리 SVG 최적화 — ${files.length}개 파일\n`)

  let totalBefore = 0
  let totalAfter = 0

  for (const file of files) {
    const filePath = join(dir, file)
    const original = readFileSync(filePath, 'utf-8')
    const before = Buffer.byteLength(original, 'utf-8')

    const result = optimize(original, {
      path: filePath,
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
              cleanupIds: false,
            },
          },
        },
        { name: 'removeDimensions' },
        {
          name: 'sortAttrs',
        },
      ],
      floatPrecision: 3,
    })

    const after = Buffer.byteLength(result.data, 'utf-8')
    const saved = before - after
    const pct = before > 0 ? ((saved / before) * 100).toFixed(1) : '0.0'

    writeFileSync(filePath, result.data)

    totalBefore += before
    totalAfter += after

    const icon = saved > 0 ? '✅' : '─'
    console.log(
      `  ${icon} ${file.padEnd(40)} ${formatBytes(before)} → ${formatBytes(after)}  (${saved > 0 ? '-' : ''}${pct}%)`,
    )
  }

  const totalSaved = totalBefore - totalAfter
  const totalPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0.0'

  console.log(`\n  ─────────────────────────────────────────────`)
  console.log(
    `  총합: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}  (-${totalPct}%, ${formatBytes(totalSaved)} 절감)\n`,
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}

main()
