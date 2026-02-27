'use client'

import { useReducer, useCallback } from 'react'

export type FlowStep = 'select' | 'form' | 'clauses' | 'sign' | 'preview' | 'submit' | 'complete'

const STEP_ORDER: FlowStep[] = ['select', 'form', 'clauses', 'sign', 'preview', 'submit', 'complete']

export const STEP_LABELS: Record<FlowStep, string> = {
  select: '서류 선택',
  form: '정보 입력',
  clauses: '법적 동의',
  sign: '서명',
  preview: '미리보기',
  submit: '제출',
  complete: '완료',
}

interface FlowState {
  step: FlowStep
  documentId: string | null
  documentType: string | null
  signerName: string
  signerPhone: string
  signatureData: string | null
  formValues: Record<string, string | boolean>
  clausesAgreed: boolean
  isSubmitting: boolean
  error: string | null
}

type FlowAction =
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GO_TO'; step: FlowStep }
  | { type: 'SET_DOCUMENT'; documentId: string }
  | { type: 'SET_SIGNER_NAME'; name: string }
  | { type: 'SET_SIGNER_PHONE'; phone: string }
  | { type: 'SET_SIGNATURE'; data: string }
  | { type: 'SET_CLAUSES_AGREED'; agreed: boolean }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_DOCUMENT_TYPE'; documentType: string }
  | { type: 'SET_FORM_VALUE'; key: string; value: string | boolean }

const initialState: FlowState = {
  step: 'select',
  documentId: null,
  documentType: null,
  signerName: '',
  signerPhone: '',
  signatureData: null,
  formValues: {},
  clausesAgreed: false,
  isSubmitting: false,
  error: null,
}

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'NEXT': {
      const idx = STEP_ORDER.indexOf(state.step)
      if (idx < STEP_ORDER.length - 1) {
        return { ...state, step: STEP_ORDER[idx + 1], error: null }
      }
      return state
    }
    case 'PREV': {
      const idx = STEP_ORDER.indexOf(state.step)
      if (idx > 0) {
        return { ...state, step: STEP_ORDER[idx - 1], error: null }
      }
      return state
    }
    case 'GO_TO':
      return { ...state, step: action.step, error: null }
    case 'SET_DOCUMENT':
      return { ...state, documentId: action.documentId }
    case 'SET_SIGNER_NAME':
      return { ...state, signerName: action.name }
    case 'SET_SIGNER_PHONE':
      return { ...state, signerPhone: action.phone }
    case 'SET_SIGNATURE':
      return { ...state, signatureData: action.data }
    case 'SET_CLAUSES_AGREED':
      return { ...state, clausesAgreed: action.agreed }
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null }
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, step: 'complete' }
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_DOCUMENT_TYPE':
      return { ...state, documentType: action.documentType, formValues: {} }
    case 'SET_FORM_VALUE':
      return { ...state, formValues: { ...state.formValues, [action.key]: action.value } }
    default:
      return state
  }
}

export function useEsignatureFlow(initialDocumentId?: string | null) {
  const [state, dispatch] = useReducer(flowReducer, {
    ...initialState,
    documentId: initialDocumentId ?? null,
    step: initialDocumentId ? 'form' : 'select',
  })

  const next = useCallback(() => dispatch({ type: 'NEXT' }), [])
  const prev = useCallback(() => dispatch({ type: 'PREV' }), [])
  const goTo = useCallback((step: FlowStep) => dispatch({ type: 'GO_TO', step }), [])
  const setDocument = useCallback((id: string) => dispatch({ type: 'SET_DOCUMENT', documentId: id }), [])
  const setSignerName = useCallback((name: string) => dispatch({ type: 'SET_SIGNER_NAME', name }), [])
  const setSignerPhone = useCallback((phone: string) => dispatch({ type: 'SET_SIGNER_PHONE', phone }), [])
  const setSignature = useCallback((data: string) => dispatch({ type: 'SET_SIGNATURE', data }), [])
  const setClausesAgreed = useCallback((agreed: boolean) => dispatch({ type: 'SET_CLAUSES_AGREED', agreed }), [])
  const setDocumentType = useCallback((dt: string) => dispatch({ type: 'SET_DOCUMENT_TYPE', documentType: dt }), [])
  const setFormValue = useCallback((key: string, value: string | boolean) => dispatch({ type: 'SET_FORM_VALUE', key, value }), [])

  const stepIndex = STEP_ORDER.indexOf(state.step)
  const isFirstStep = stepIndex === 0 || (initialDocumentId && stepIndex === 1)
  const isLastStep = state.step === 'complete'
  const displaySteps = STEP_ORDER.slice(0, -1) // exclude 'complete' from indicator

  return {
    ...state,
    stepIndex,
    isFirstStep,
    isLastStep,
    displaySteps,
    dispatch,
    next,
    prev,
    goTo,
    setDocument,
    setSignerName,
    setSignerPhone,
    setSignature,
    setClausesAgreed,
    setDocumentType,
    setFormValue,
  }
}
