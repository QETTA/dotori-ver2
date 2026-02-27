'use client'

/**
 * E-Signature Multi-Step Flow Page (R38 → R41 Polish)
 *
 * Steps: select → form → clauses → sign → preview → submit → complete
 * URL: /my/documents/sign?documentId=xxx
 *
 * R41: AnimatePresence step transitions, DS tokens, BrandWatermark, scrollFadeIn
 */
import { useSearchParams } from 'next/navigation'
import { useRef, useMemo, Suspense } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Text } from '@/components/catalyst/text'
import { Input } from '@/components/catalyst/input'
import { Fieldset, Field, Label } from '@/components/catalyst/fieldset'
import { Divider } from '@/components/catalyst/divider'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { InlineAlert } from '@/components/dotori/InlineAlert'
import {
  SignaturePad,
  exportSignaturePNG,
  SignaturePreview,
  StepIndicator,
  LegalClausesPanel,
  DocumentSelector,
  DocumentFormRenderer,
  SuccessPanel,
} from '@/components/dotori/esignature'
import type { SelectableDocument } from '@/components/dotori/esignature'
import { useEsignatureFlow, STEP_LABELS } from '@/hooks/use-esignature-flow'
import { useDocuments } from '@/hooks/use-documents'
import { apiFetch } from '@/lib/api'
import { getTemplate } from '@/lib/esignature-templates'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

const LEGAL_CLAUSES = [
  { id: 'privacy', label: '개인정보 수집·이용에 동의합니다', required: true },
  { id: 'terms', label: '전자서명 이용약관에 동의합니다', required: true },
  { id: 'accuracy', label: '작성 내용이 사실과 다르지 않음을 확인합니다', required: true },
  { id: 'marketing', label: '서비스 관련 안내 수신에 동의합니다 (선택)', required: false },
]

const stepMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
}

function SignFlowContent() {
  const searchParams = useSearchParams()
  const initialDocId = searchParams.get('documentId')
  const padWrapperRef = useRef<HTMLDivElement>(null)

  const flow = useEsignatureFlow(initialDocId)
  const { documents } = useDocuments()

  const selectableDocs: SelectableDocument[] = (documents ?? [])
    .filter((d) => d.status === 'pending')
    .map((d) => ({ id: d.id, title: d.name, type: d.description, status: 'pending' }))

  const template = useMemo(
    () => (flow.documentType ? getTemplate(flow.documentType) : null),
    [flow.documentType],
  )

  const stepLabels = flow.displaySteps.map((s) => STEP_LABELS[s])

  const canProceed = (): boolean => {
    switch (flow.step) {
      case 'select': return flow.documentId !== null
      case 'form': {
        const nameOk = flow.signerName.trim().length > 0
        const phoneOk = flow.signerPhone.trim().length > 0
        const fieldsOk = !template || template.fields
          .filter(f => f.required)
          .every(f => {
            const v = flow.formValues[f.key]
            return f.type === 'checkbox' ? v === true : typeof v === 'string' && v.trim().length > 0
          })
        return nameOk && phoneOk && fieldsOk
      }
      case 'clauses': return flow.clausesAgreed
      case 'sign': return !!flow.signatureData
      case 'preview': return true
      default: return false
    }
  }

  const handleNext = async () => {
    if (flow.step === 'preview') {
      flow.dispatch({ type: 'SUBMIT_START' })
      try {
        await apiFetch(`/api/esignature/${flow.documentId}/sign`, {
          method: 'POST',
          body: JSON.stringify({
            signerName: flow.signerName,
            signerPhone: flow.signerPhone,
            signatureData: flow.signatureData,
            formValues: flow.formValues,
            documentType: flow.documentType,
          }),
        })
        flow.dispatch({ type: 'SUBMIT_SUCCESS' })
      } catch (err) {
        flow.dispatch({
          type: 'SUBMIT_ERROR',
          error: err instanceof Error ? err.message : '서명 제출에 실패했어요',
        })
      }
      return
    }
    flow.next()
  }

  const handleSignatureChange = (hasSignature: boolean) => {
    if (hasSignature) {
      const canvas = padWrapperRef.current?.querySelector('canvas')
      if (canvas) {
        const data = exportSignaturePNG(canvas)
        flow.setSignature(data)
      }
    } else {
      flow.dispatch({ type: 'SET_SIGNATURE', data: '' })
    }
  }

  if (flow.step === 'complete') {
    return (
      <div className="space-y-6">
        <BreadcrumbNav parent={{ label: '서류함', href: '/my/documents' }} current="서명 완료" />
        <SuccessPanel />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav parent={{ label: '서류함', href: '/my/documents' }} current="서류 서명" />

      {/* Step Indicator */}
      <FadeIn>
        <StepIndicator steps={stepLabels} currentStep={flow.stepIndex} />
      </FadeIn>

      {/* Step Content — AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        <motion.div key={flow.step} {...stepMotion}>
          <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'relative overflow-hidden p-5')}>
            {flow.step === 'select' && <BrandWatermark className="opacity-20" />}

            {flow.step === 'select' && (
              <div className="relative space-y-4">
                <div>
                  <p className={cn(DS_PAGE_HEADER.eyebrow, 'sm:text-xs/5')}>1단계</p>
                  <h2 className={cn('mt-2 font-wordmark text-xl/8', DS_PAGE_HEADER.title)}>
                    서명할 서류를 선택하세요
                  </h2>
                </div>
                <DocumentSelector
                  documents={selectableDocs}
                  selectedId={flow.documentId}
                  onSelect={(id) => {
                    flow.setDocument(id)
                    const raw = (documents ?? []).find(d => d.id === id)
                    if (raw?.documentType) flow.setDocumentType(raw.documentType)
                  }}
                />
              </div>
            )}

            {flow.step === 'form' && (
              <div className="space-y-4">
                <div>
                  <p className={cn(DS_PAGE_HEADER.eyebrow, 'sm:text-xs/5')}>2단계</p>
                  <h2 className={cn('mt-2 font-wordmark text-xl/8', DS_PAGE_HEADER.title)}>
                    서류 정보를 입력하세요
                  </h2>
                </div>

                {template && (
                  <DocumentFormRenderer
                    fields={template.fields}
                    values={flow.formValues}
                    onChange={flow.setFormValue}
                  />
                )}

                {template && <Divider className="my-6" />}

                <h3 className={DS_TYPOGRAPHY.h3}>서명자 정보</h3>
                <Fieldset>
                  <Field>
                    <Label>이름</Label>
                    <Input
                      type="text"
                      placeholder="홍길동"
                      value={flow.signerName}
                      onChange={(e) => flow.setSignerName(e.target.value)}
                    />
                  </Field>
                  <Field className="mt-4">
                    <Label>연락처</Label>
                    <Input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={flow.signerPhone}
                      onChange={(e) => flow.setSignerPhone(e.target.value)}
                    />
                  </Field>
                </Fieldset>
              </div>
            )}

            {flow.step === 'clauses' && (
              <div className="space-y-4">
                <div>
                  <p className={cn(DS_PAGE_HEADER.eyebrow, 'sm:text-xs/5')}>3단계</p>
                  <h2 className={cn('mt-2 font-wordmark text-xl/8', DS_PAGE_HEADER.title)}>
                    법적 동의
                  </h2>
                </div>
                <Text className={cn(DS_TYPOGRAPHY.bodySm, DS_PAGE_HEADER.subtitle)}>
                  서명을 진행하려면 아래 항목에 동의해주세요.
                </Text>
                <LegalClausesPanel
                  clauses={[
                    ...LEGAL_CLAUSES,
                    ...(template?.legalClauses ?? []).map((clause, i) => ({
                      id: `template-${i}`,
                      label: clause,
                      required: true,
                    })),
                  ]}
                  onAllAgreed={flow.setClausesAgreed}
                />
              </div>
            )}

            {flow.step === 'sign' && (
              <div className="space-y-4">
                <div>
                  <p className={cn(DS_PAGE_HEADER.eyebrow, 'sm:text-xs/5')}>4단계</p>
                  <h2 className={cn('mt-2 font-wordmark text-xl/8', DS_PAGE_HEADER.title)}>
                    서명하세요
                  </h2>
                </div>
                <Text className={cn(DS_TYPOGRAPHY.bodySm, DS_PAGE_HEADER.subtitle)}>
                  아래 영역에 서명을 그려주세요. 되돌리기와 지우기가 가능합니다.
                </Text>
                <div ref={padWrapperRef}>
                  <SignaturePad onChange={handleSignatureChange} />
                </div>
              </div>
            )}

            {flow.step === 'preview' && (
              <div className="space-y-4">
                <div>
                  <p className={cn(DS_PAGE_HEADER.eyebrow, 'sm:text-xs/5')}>5단계</p>
                  <h2 className={cn('mt-2 font-wordmark text-xl/8', DS_PAGE_HEADER.title)}>
                    서명 확인
                  </h2>
                </div>
                <Text className={cn(DS_TYPOGRAPHY.bodySm, DS_PAGE_HEADER.subtitle)}>
                  서명 내용을 확인하고 제출하세요.
                </Text>
                <div className="space-y-3">
                  <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-4')}>
                    <Text className={DS_TYPOGRAPHY.caption}>서명자</Text>
                    <Text className={cn('mt-1', DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
                      {flow.signerName} · {flow.signerPhone}
                    </Text>
                  </div>
                  {template && Object.keys(flow.formValues).length > 0 && (
                    <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-4')}>
                      <Text className={DS_TYPOGRAPHY.caption}>{template.title}</Text>
                      <div className="mt-2 space-y-1">
                        {template.fields.map(f => {
                          const v = flow.formValues[f.key]
                          if (v === undefined || v === '' || v === false) return null
                          return (
                            <Text key={f.key} className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-950 dark:text-dotori-50')}>
                              <span className="text-dotori-500">{f.label}:</span>{' '}
                              {typeof v === 'boolean' ? '동의' : v}
                            </Text>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {flow.signatureData && (
                    <SignaturePreview dataUrl={flow.signatureData} />
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      <InlineAlert
        variant="warning"
        title={flow.error ?? ''}
        show={flow.error !== null}
        onDismiss={() => flow.dispatch({ type: 'CLEAR_ERROR' })}
      />

      {/* Navigation */}
      <FadeIn>
        <div className="flex gap-3">
          {!flow.isFirstStep && (
            <DsButton variant="secondary" onClick={flow.prev} className="flex-1">
              이전
            </DsButton>
          )}
          <DsButton
            onClick={handleNext}
            disabled={!canProceed() || flow.isSubmitting}
            className="flex-1"
          >
            {flow.isSubmitting
              ? '제출 중...'
              : flow.step === 'preview'
                ? '서명 제출'
                : '다음'}
          </DsButton>
        </div>
      </FadeIn>
    </div>
  )
}

export default function SignPage() {
  return (
    <Suspense>
      <SignFlowContent />
    </Suspense>
  )
}
