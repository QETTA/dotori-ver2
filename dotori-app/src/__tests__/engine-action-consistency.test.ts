import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { isKnownBlockAction } from '@/lib/chat/block-actions'

const ENGINE_RESPONSE_BUILDER_FILES = [
  'src/lib/engine/response-builder/blocks.ts',
  'src/lib/engine/response-builder/recommendation.ts',
  'src/lib/engine/response-builder/search.ts',
  'src/lib/engine/response-builder/status.ts',
] as const

const BLOCK_ACTION_ID_PATTERN =
  /\{\s*id:\s*"([^"]+)"[\s\S]*?action:\s*"[^"]+"/g

function extractEngineActionIds(): string[] {
  const ids = new Set<string>()
  for (const relativeFile of ENGINE_RESPONSE_BUILDER_FILES) {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), relativeFile),
      'utf8',
    )

    for (const match of source.matchAll(BLOCK_ACTION_ID_PATTERN)) {
      ids.add(match[1] ?? '')
    }
  }

  return [...ids].sort()
}

describe('engine action consistency', () => {
  it('maps every engine action id to a known chat client handler', () => {
    const actionIds = extractEngineActionIds()
    const unmappedActionIds = actionIds.filter((id) => !isKnownBlockAction(id))

    expect(actionIds.length).toBeGreaterThan(0)
    expect(unmappedActionIds).toEqual([])
  })
})
