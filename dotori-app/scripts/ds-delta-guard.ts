import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type AuditReportFile = {
  file: string
  hasDesignTokens: boolean
  hasBrandSignal: boolean
  classNameAssignments: number
  rawClassNameLiterals: number
}

type AuditReport = {
  files: AuditReportFile[]
}

type DeltaAudit = {
  file: string
  source: 'report' | 'fallback'
  hasDesignTokens: boolean
  hasBrandSignal: boolean
  classNameAssignments: number
  rawClassNameLiterals: number
}

type DeltaViolation = {
  audit: DeltaAudit
  reasons: string[]
}

const TOKENS_USAGE_PATTERN =
  /\bDS_(?:TYPOGRAPHY|TEXT|GLASS|LAYOUT|SURFACE|STATUS|STATUS_ALIAS|SENTIMENT|FRESHNESS|PROGRESS|TOAST|SHADOW|CARD|PAGE_HEADER|EMPTY_STATE|FAB|STICKY_BAR)\b/
const BRAND_SIGNAL_PATTERN =
  /\bDS_(?:GLASS|SURFACE|STATUS|STATUS_ALIAS|SENTIMENT|FRESHNESS|PROGRESS|TOAST|CARD|PAGE_HEADER|EMPTY_STATE|SHADOW|TEXT)\b|color\s*=\s*["'](?:dotori|forest|amber)["']/
const CLASSNAME_ASSIGNMENT_PATTERN = /\bclassName\s*=/g
const RAW_CLASS_LITERAL_PATTERN = /\bclassName\s*=\s*["'`]/g

function toPosix(value: string): string {
  return value.replaceAll('\\', '/')
}

function splitPathList(raw: string): string[] {
  return raw
    .split(/[,\r\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function splitLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function runGit(repoRoot: string, args: string[]): string {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
}

function tryGitDiffFiles(repoRoot: string, range: string): string[] | null {
  try {
    const raw = runGit(repoRoot, ['diff', '--name-only', '--diff-filter=ACMRTUX', range])
    return splitLines(raw)
  } catch {
    return null
  }
}

function getFallbackDiffFiles(repoRoot: string): string[] {
  const diffFiles = tryGitDiffFiles(repoRoot, 'HEAD~1...HEAD')
  if (diffFiles !== null) {
    return diffFiles
  }
  const fallback = runGit(repoRoot, ['show', '--pretty=format:', '--name-only', 'HEAD'])
  return splitLines(fallback)
}

function parseStatusPorcelainPaths(raw: string): string[] {
  if (raw.length === 0) {
    return []
  }

  const entries = raw.split('\0').filter((entry) => entry.length > 0)
  const files: string[] = []

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index] ?? ''
    if (entry.length < 4) {
      continue
    }
    const x = entry[0] ?? ''
    const y = entry[1] ?? ''
    const filePath = entry.slice(3)
    const isRenameOrCopy = x === 'R' || x === 'C' || y === 'R' || y === 'C'

    if (isRenameOrCopy && index + 1 < entries.length) {
      files.push(entries[index + 1] ?? '')
      index += 1
      continue
    }

    files.push(filePath)
  }

  return files
}

function normalizeToAppRelative(
  rawPath: string,
  appRoot: string,
  appPrefixFromRepoRoot: string,
): string | null {
  let normalized = rawPath.trim().replace(/^["']|["']$/g, '')
  if (normalized.length === 0) {
    return null
  }

  if (path.isAbsolute(normalized)) {
    const rel = toPosix(path.relative(appRoot, normalized))
    if (rel.startsWith('..')) {
      return null
    }
    return rel
  }

  normalized = toPosix(normalized).replace(/^\.\//, '')
  if (appPrefixFromRepoRoot.length > 0 && normalized.startsWith(`${appPrefixFromRepoRoot}/`)) {
    normalized = normalized.slice(appPrefixFromRepoRoot.length + 1)
  }

  return normalized.length > 0 ? normalized : null
}

function isScopedTarget(file: string): boolean {
  const normalized = toPosix(file)
  if (!normalized.endsWith('.tsx')) {
    return false
  }
  if (!normalized.startsWith('src/app/') && !normalized.startsWith('src/components/dotori/')) {
    return false
  }
  if (normalized.includes('/components/catalyst/')) {
    return false
  }
  if (normalized.includes('/__tests__/')) {
    return false
  }
  return !/\.(?:test|spec)\.tsx$/.test(normalized)
}

function countMatches(content: string, pattern: RegExp): number {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const matcher = new RegExp(pattern.source, flags)
  return content.match(matcher)?.length ?? 0
}

function auditFileFallback(appRoot: string, file: string): DeltaAudit | null {
  const absolute = path.join(appRoot, file)
  if (!fs.existsSync(absolute)) {
    return null
  }

  const content = fs.readFileSync(absolute, 'utf8')
  return {
    file,
    source: 'fallback',
    hasDesignTokens: TOKENS_USAGE_PATTERN.test(content),
    hasBrandSignal: BRAND_SIGNAL_PATTERN.test(content),
    classNameAssignments: countMatches(content, CLASSNAME_ASSIGNMENT_PATTERN),
    rawClassNameLiterals: countMatches(content, RAW_CLASS_LITERAL_PATTERN),
  }
}

function isAuditReport(input: unknown): input is AuditReport {
  if (!input || typeof input !== 'object') {
    return false
  }
  const files = (input as { files?: unknown }).files
  if (!Array.isArray(files)) {
    return false
  }
  return files.every((file) => {
    if (!file || typeof file !== 'object') {
      return false
    }
    const typed = file as Partial<AuditReportFile>
    return (
      typeof typed.file === 'string' &&
      typeof typed.hasDesignTokens === 'boolean' &&
      typeof typed.hasBrandSignal === 'boolean' &&
      typeof typed.classNameAssignments === 'number' &&
      typeof typed.rawClassNameLiterals === 'number'
    )
  })
}

function parseAuditReport(rawOutput: string): AuditReport {
  const trimmed = rawOutput.trim()
  if (trimmed.length === 0) {
    throw new Error('Design-system report is empty.')
  }

  const candidates = [trimmed]
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1))
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (isAuditReport(parsed)) {
        return parsed
      }
    } catch {
      continue
    }
  }

  throw new Error('Unable to parse check-design-system report JSON.')
}

function runDesignAudit(appRoot: string): AuditReport {
  const tsxBin = path.join(
    appRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
  )
  const useLocalTsx = fs.existsSync(tsxBin)
  const command = useLocalTsx ? tsxBin : 'npx'
  const args = useLocalTsx
    ? ['scripts/check-design-system.ts']
    : ['tsx', 'scripts/check-design-system.ts']
  const auditEnv: NodeJS.ProcessEnv = {
    ...process.env,
    DS_REPORT: '1',
    DS_AUDIT_ALL: '1',
    DS_SCORE_ENFORCE: '0',
    DS_STYLE_NEUTRAL_ENFORCE: '0',
  }
  delete auditEnv.DS_RAW_CLASS_MAX

  try {
    const raw = execFileSync(command, args, {
      cwd: appRoot,
      encoding: 'utf8',
      env: auditEnv,
    })
    return parseAuditReport(raw)
  } catch (error) {
    const stdout = (error as { stdout?: string }).stdout
    if (typeof stdout === 'string' && stdout.trim().length > 0) {
      return parseAuditReport(stdout)
    }
    throw error
  }
}

function resolveRepoRoot(appRoot: string): string {
  return runGit(appRoot, ['rev-parse', '--show-toplevel']).trim()
}

function resolveChangedFiles(
  repoRoot: string,
  appRoot: string,
  appPrefixFromRepoRoot: string,
): {
  changedFiles: string[]
  sourceLabel: string
} {
  const explicitChanged = process.env.DS_CHANGED_FILES?.trim()
  const rawFiles: string[] = []
  let sourceLabel = ''

  if (explicitChanged && explicitChanged.length > 0) {
    rawFiles.push(...splitPathList(explicitChanged))
    sourceLabel = 'DS_CHANGED_FILES'
  } else {
    const baseRef = (process.env.GITHUB_BASE_REF ?? process.env.DS_BASE_REF ?? '').trim()
    if (baseRef.length > 0) {
      const baseRange = `origin/${baseRef}...HEAD`
      const baseFiles = tryGitDiffFiles(repoRoot, baseRange)
      if (baseFiles !== null) {
        rawFiles.push(...baseFiles)
        sourceLabel = `git diff ${baseRange}`
      } else {
        rawFiles.push(...getFallbackDiffFiles(repoRoot))
        sourceLabel = `git diff HEAD~1...HEAD (fallback; ${baseRange} unavailable)`
      }
    } else {
      rawFiles.push(...getFallbackDiffFiles(repoRoot))
      sourceLabel = 'git diff HEAD~1...HEAD'
    }
  }

  if (process.env.DS_INCLUDE_WORKTREE === '1') {
    const statusRaw = runGit(repoRoot, ['status', '--porcelain', '-z', '--untracked-files=all'])
    rawFiles.push(...parseStatusPorcelainPaths(statusRaw))
    sourceLabel = sourceLabel ? `${sourceLabel} + git status --porcelain` : 'git status --porcelain'
  }

  const normalized = new Set<string>()
  for (const file of rawFiles) {
    const candidate = normalizeToAppRelative(file, appRoot, appPrefixFromRepoRoot)
    if (candidate) {
      normalized.add(candidate)
    }
  }

  return {
    changedFiles: Array.from(normalized),
    sourceLabel,
  }
}

function isStyleBearing(audit: DeltaAudit): boolean {
  return audit.rawClassNameLiterals > 0 || audit.classNameAssignments > 0
}

function toDeltaAuditFromReport(
  file: AuditReportFile,
  appRoot: string,
  appPrefixFromRepoRoot: string,
): DeltaAudit | null {
  const normalized = normalizeToAppRelative(file.file, appRoot, appPrefixFromRepoRoot)
  if (!normalized) {
    return null
  }
  return {
    file: normalized,
    source: 'report',
    hasDesignTokens: file.hasDesignTokens,
    hasBrandSignal: file.hasBrandSignal,
    classNameAssignments: file.classNameAssignments,
    rawClassNameLiterals: file.rawClassNameLiterals,
  }
}

function loadAllowlist(appRoot: string): Set<string> {
  const allowlistPath = path.join(appRoot, '.ds-allowlist')
  if (!fs.existsSync(allowlistPath)) {
    return new Set()
  }
  const content = fs.readFileSync(allowlistPath, 'utf8')
  const entries = content
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter((line) => line.length > 0)
  return new Set(entries.map(toPosix))
}

function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const appRoot = path.resolve(scriptDir, '..')
  const repoRoot = resolveRepoRoot(appRoot)
  const appPrefixRaw = path.relative(repoRoot, appRoot)
  const appPrefixFromRepoRoot = appPrefixRaw === '.' ? '' : toPosix(appPrefixRaw)

  const { changedFiles, sourceLabel } = resolveChangedFiles(
    repoRoot,
    appRoot,
    appPrefixFromRepoRoot,
  )
  const scopedChanged = changedFiles.filter(isScopedTarget)
  if (scopedChanged.length === 0) {
    console.log(`DS delta guard: no scoped changed files (${sourceLabel || 'no delta source'})`)
    return
  }

  const report = runDesignAudit(appRoot)
  const reportByFile = new Map<string, DeltaAudit>()
  for (const reportFile of report.files) {
    const normalized = toDeltaAuditFromReport(reportFile, appRoot, appPrefixFromRepoRoot)
    if (normalized) {
      reportByFile.set(normalized.file, normalized)
    }
  }

  const collectedAudits: DeltaAudit[] = []
  const fallbackFiles: string[] = []
  for (const file of scopedChanged) {
    const reportAudit = reportByFile.get(file)
    if (reportAudit) {
      collectedAudits.push(reportAudit)
      continue
    }

    const fallbackAudit = auditFileFallback(appRoot, file)
    if (fallbackAudit) {
      collectedAudits.push(fallbackAudit)
      fallbackFiles.push(file)
    }
  }

  const allowlist = loadAllowlist(appRoot)

  const styleBearingAudits = collectedAudits.filter(isStyleBearing)
  const violations: DeltaViolation[] = []
  const allowlisted: string[] = []
  for (const audit of styleBearingAudits) {
    const reasons: string[] = []
    if (!audit.hasDesignTokens) {
      reasons.push('hasDesignTokens=true')
    }
    if (audit.file.startsWith('src/components/dotori/') && !audit.hasBrandSignal) {
      reasons.push('hasBrandSignal=true')
    }
    if (reasons.length > 0) {
      if (allowlist.has(audit.file)) {
        allowlisted.push(audit.file)
      } else {
        violations.push({ audit, reasons })
      }
    }
  }

  if (violations.length > 0) {
    console.error(
      `DS delta guard: ${violations.length} violation(s) found across ${styleBearingAudits.length} style-bearing changed file(s).`,
    )
    console.error(`Changed source: ${sourceLabel || 'unknown'}`)
    for (const violation of violations) {
      const { audit, reasons } = violation
      console.error(`- ${audit.file}`)
      console.error(
        `  actual: hasDesignTokens=${audit.hasDesignTokens}, hasBrandSignal=${audit.hasBrandSignal}, classNameAssignments=${audit.classNameAssignments}, rawClassNameLiterals=${audit.rawClassNameLiterals}, source=${audit.source}`,
      )
      console.error(`  missing requirement: ${reasons.join(', ')}`)
    }
    if (allowlisted.length > 0) {
      console.error(`(${allowlisted.length} file(s) skipped via .ds-allowlist)`)
    }
    process.exit(1)
  }

  console.log(
    `DS delta guard: OK (${styleBearingAudits.length} style-bearing / ${scopedChanged.length} scoped changed files)`,
  )
  console.log(`Changed source: ${sourceLabel || 'unknown'}`)
  if (allowlisted.length > 0) {
    console.log(`Allowlisted: ${allowlisted.length} file(s) — fix these to remove from .ds-allowlist`)
  }
  if (fallbackFiles.length > 0) {
    console.log(
      `Fallback audit used for ${fallbackFiles.length} file(s): ${fallbackFiles.join(', ')}`,
    )
  }
}

main()
