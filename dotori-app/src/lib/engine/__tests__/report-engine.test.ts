import type { ChildProfile, Facility } from '@/types/dotori'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateChecklist, generateReport } from '../report-engine'

type FacilityOverrides = Partial<Facility> & {
  capacity?: Partial<Facility['capacity']>
}

function makeFacility(overrides: FacilityOverrides = {}): Facility {
  const base: Facility = {
    id: 'facility-1',
    name: '해오름어린이집',
    type: '국공립',
    status: 'available',
    address: '서울시 강남구',
    lat: 37.5,
    lng: 127.0,
    phone: '02-000-0000',
    capacity: { total: 30, current: 25, waiting: 2 },
    features: ['숲활동'],
    rating: 4.5,
    reviewCount: 10,
    lastSyncedAt: '2026-02-01T00:00:00.000Z',
  }

  return {
    ...base,
    ...overrides,
    capacity: {
      ...base.capacity,
      ...(overrides.capacity || {}),
    },
    features: overrides.features ?? base.features,
  }
}

describe('report-engine', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates comparison report with highlighted status and rating', () => {
    const report = generateReport([
      makeFacility({ id: 'f1', name: '해오름', status: 'available', rating: 4.8 }),
      makeFacility({ id: 'f2', name: '무지개', status: 'waiting', rating: 4.2 }),
    ])

    expect(report.title).toContain('해오름 vs 무지개')

    const statusItem = report.sections
      .find((section) => section.title === '정원 현황')
      ?.items.find((item) => item.label === '입소 상태')
    expect(statusItem?.highlight).toBe(0)

    const ratingItem = report.sections
      .find((section) => section.title === '품질 평가')
      ?.items.find((item) => item.label === '평점')
    expect(ratingItem?.highlight).toBe(0)
  })

  it('falls back safely when facilities have no rating data', () => {
    const report = generateReport([
      makeFacility({ id: 'f1', name: 'A', rating: 0 }),
      makeFacility({ id: 'f2', name: 'B', rating: 0 }),
    ])

    const ratingItem = report.sections
      .find((section) => section.title === '품질 평가')
      ?.items.find((item) => item.label === '평점')
    expect(ratingItem?.highlight).toBeUndefined()
    expect(report.summary.length).toBeGreaterThan(0)
  })

  it('adds national/public specific checklist items', () => {
    const checklist = generateChecklist(
      makeFacility({ type: '국공립', name: '국공립해오름' }),
      null,
    )

    const docTexts = checklist.categories
      .find((c) => c.title === '서류 준비')
      ?.items.map((item) => item.text)
    expect(docTexts).toContain('재직증명서 (양육자)')
    expect(docTexts).toContain('건강보험 자격득실 확인서')
  })

  it('branches child prep items by age boundaries', () => {
    const infant: ChildProfile = {
      id: 'child-1',
      name: '도토리',
      birthDate: '2025-12-01',
      gender: 'female',
    }
    const older: ChildProfile = {
      id: 'child-2',
      name: '참깨',
      birthDate: '2022-01-01',
      gender: 'male',
    }

    const infantChecklist = generateChecklist(makeFacility(), infant)
    const olderChecklist = generateChecklist(makeFacility(), older)

    const infantTexts = infantChecklist.categories
      .find((c) => c.title === '아이 준비물')
      ?.items.map((item) => item.text)
    const olderTexts = olderChecklist.categories
      .find((c) => c.title === '아이 준비물')
      ?.items.map((item) => item.text)

    expect(infantTexts).toContain('젖병/분유/이유식 용기')
    expect(olderTexts).toContain('개인 컵/칫솔/치약')
  })

  it('emits deterministic generatedAt when system time is fixed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-23T09:00:00.000Z'))

    const report = generateReport([
      makeFacility({ id: 'f1', name: 'A' }),
      makeFacility({ id: 'f2', name: 'B' }),
    ])
    const checklist = generateChecklist(makeFacility({ name: 'A' }), null)

    expect(report.generatedAt).toBe('2026-02-23T09:00:00.000Z')
    expect(checklist.generatedAt).toBe('2026-02-23T09:00:00.000Z')
  })
})
