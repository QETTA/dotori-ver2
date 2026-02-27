/**
 * Batch SVG optimizer using SVGO.
 * Optimizes all SVGs in public/brand/ directory.
 *
 * Usage: npm run optimize:svg
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { optimize } from 'svgo'

const BRAND_DIR = join(import.meta.dirname, '..', 'public', 'brand')

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}

function optimizeSvgs() {
  let files: string[]
  try {
    files = readdirSync(BRAND_DIR).filter((f) => f.endsWith('.svg'))
  } catch {
    console.error(`Directory not found: ${BRAND_DIR}`)
    process.exit(1)
  }

  if (files.length === 0) {
    console.log('No SVG files found.')
    return
  }

  let totalBefore = 0
  let totalAfter = 0

  for (const file of files) {
    const filePath = join(BRAND_DIR, file)
    const original = readFileSync(filePath, 'utf-8')
    const beforeSize = statSync(filePath).size

    const result = optimize(original, {
      path: filePath,
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              // Keep viewBox for responsive SVGs
              removeViewBox: false,
              // Keep brand-critical attributes
              removeUnknownsAndDefaults: {
                keepDataAttrs: true,
              },
            },
          },
        },
        'removeDimensions',
        'removeXMLNS',
        'sortAttrs',
      ],
    })

    writeFileSync(filePath, result.data)
    const afterSize = Buffer.byteLength(result.data)

    totalBefore += beforeSize
    totalAfter += afterSize

    const saved = beforeSize - afterSize
    const pct = beforeSize > 0 ? ((saved / beforeSize) * 100).toFixed(1) : '0'
    console.log(
      `  ${file}: ${formatBytes(beforeSize)} → ${formatBytes(afterSize)} (−${pct}%)`,
    )
  }

  const totalSaved = totalBefore - totalAfter
  const totalPct =
    totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0'
  console.log(
    `\n  Total: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (−${totalPct}%)`,
  )
  console.log(`  ${files.length} files optimized.`)
}

optimizeSvgs()
