'use client'

import { useMemo } from 'react'
import { useApi } from './use-api'

/** Matches the ESignatureDocumentDTO from GET /api/esignature */
interface ApiDocument {
  id: string
  userId: string
  facilityId: string
  documentType: string
  status: string
  title: string
  fileUrl?: string
  signedAt?: string
  expiresAt?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface DocumentView {
  id: string
  name: string
  description: string
  documentType: string
  status: 'submitted' | 'due_soon' | 'pending'
  submittedAt: string | null
  dueDate: string | null
}

const STATUS_MAP: Record<string, DocumentView['status']> = {
  signed: 'submitted',
  submitted: 'submitted',
  expired: 'due_soon',
  pending: 'pending',
  draft: 'pending',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  // enrollment (7종)
  입소신청서: '입소 신청서',
  건강검진확인서: '건강검진 결과서',
  예방접종증명서: '예방접종 증명서',
  영유아건강검진결과통보서: '영유아 건강검진 결과',
  주민등록등본: '주민등록등본',
  재직증명서: '재직증명서',
  소득증빙서류: '소득 증빙서류',
  // consent (7종)
  입소동의서: '입소 동의서',
  개인정보동의서: '개인정보 수집·이용 동의서',
  귀가동의서: '귀가 동의서',
  투약의뢰서: '투약 의뢰서',
  현장학습동의서: '현장학습 동의서',
  차량운행동의서: '차량운행 동의서',
  CCTV열람동의서: 'CCTV 열람 동의서',
}

function toDocumentView(doc: ApiDocument): DocumentView {
  const status = STATUS_MAP[doc.status] ?? 'pending'
  const isDueSoon =
    status === 'pending' &&
    doc.expiresAt &&
    new Date(doc.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

  return {
    id: doc.id,
    name: doc.title || DOC_TYPE_LABELS[doc.documentType] || doc.documentType,
    description: DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType,
    documentType: doc.documentType,
    status: isDueSoon ? 'due_soon' : status,
    submittedAt: doc.signedAt ? new Date(doc.signedAt).toISOString().slice(0, 10) : null,
    dueDate: doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : null,
  }
}

export function useDocuments() {
  const { data, isLoading, error, refetch } = useApi<ApiDocument[]>('/api/esignature')

  const documents = useMemo(() => (data ?? []).map(toDocumentView), [data])

  const completionRate = useMemo(() => {
    if (documents.length === 0) return 0
    const completed = documents.filter((d) => d.status === 'submitted').length
    return Math.round((completed / documents.length) * 100)
  }, [documents])

  const pendingCount = useMemo(
    () => documents.filter((d) => d.status !== 'submitted').length,
    [documents],
  )

  return { documents, completionRate, pendingCount, isLoading, error, refetch }
}
