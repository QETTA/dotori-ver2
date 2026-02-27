'use client'

import { DsButton } from "@/components/ds/DsButton";
import { Checkbox, CheckboxField } from '@/components/catalyst/checkbox'
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '@/components/catalyst/dialog'
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/catalyst/description-list'
import type { ActionStatus } from '@/types/dotori'
import { useState } from 'react'
import { StreamingIndicator } from './StreamingIndicator'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand-assets'
import { DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'

const ACTION_CONFIRM_STATUS_TONE = {
  executing: 'waiting',
  success: 'available',
  error: 'full',
} as const

const ACTION_CONFIRM_STATUS_SIGNAL = Object.entries(ACTION_CONFIRM_STATUS_TONE)
  .map(([status, tone]) => `${status}:${DS_STATUS[tone].label}`)
  .join('|')

const ACTION_CONFIRM_SIGNAL_PROPS = {
  'data-dotori-brand': BRAND.symbol,
  'data-dotori-glass-surface': 'glass-sheet',
  'data-dotori-status-signal': ACTION_CONFIRM_STATUS_SIGNAL,
} as const

function resolveActionConfirmTone(status: ActionStatus) {
  if (status === 'executing' || status === 'success' || status === 'error') {
    return ACTION_CONFIRM_STATUS_TONE[status]
  }

  return undefined
}

export function ActionConfirmSheet({
  open,
  onClose,
  title,
  description,
  preview,
  onConfirm,
  status,
  error,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  preview: Record<string, string>
  onConfirm: () => void
  status: ActionStatus
  error?: string
}) {
  const [agreed, setAgreed] = useState(false)
  const dialogClassName = cn('glass-sheet', '!bg-white/90 backdrop-blur-xl backdrop-saturate-150 !shadow-xl !ring-dotori-100/60 dark:!bg-dotori-950/75 dark:!ring-dotori-700/40')
  const statusTone = resolveActionConfirmTone(status)
  const statusToneBorderClassName = statusTone ? DS_STATUS[statusTone].border : undefined
  const dialogBodyClassName = 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 duration-200'
  const stateSignal = <span aria-hidden="true" hidden {...ACTION_CONFIRM_SIGNAL_PROPS} />

  if (status === 'executing') {
    return (
      <Dialog
        open={open}
        onClose={() => {}}
        aria-label="액션 확인"
        className={cn(dialogClassName, statusToneBorderClassName)}
      >
        {stateSignal}
        <DialogBody className={dialogBodyClassName}>
          <div className={'flex flex-col items-center gap-3 py-8'}>
            <StreamingIndicator text="처리 중이에요..." />
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  if (status === 'success') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        aria-label="액션 확인"
        className={cn(dialogClassName, statusToneBorderClassName)}
      >
        {stateSignal}
        <DialogBody className={dialogBodyClassName}>
          <div className={'flex flex-col items-center gap-3 py-8'}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND.symbol}
              alt=""
              aria-hidden="true"
              className={'h-12 w-12 text-forest-500'}
            />
            <p className={cn(DS_TYPOGRAPHY.h2, 'font-semibold text-dotori-900 dark:text-dotori-50')}>완료되었습니다</p>
            <DsButton onClick={onClose} className={'min-h-11 w-full'}>
              확인
            </DsButton>
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  if (status === 'error') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        aria-label="액션 확인"
        className={cn(dialogClassName, statusToneBorderClassName)}
      >
        {stateSignal}
        <DialogBody className={dialogBodyClassName}>
          <div className={'flex flex-col items-center gap-3 py-8'}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND.errorState}
              alt=""
              aria-hidden="true"
              className={'h-12 w-12 text-amber-700'}
            />
            <p className={'text-body text-amber-800 dark:text-amber-200'}>
              {error ?? '처리 중 문제가 발생했어요. 다시 시도해 주세요.'}
            </p>
            <div className={'mt-4 flex w-full flex-col gap-3 sm:flex-row'}>
              <DsButton variant="ghost" onClick={onClose} className={'min-h-11 w-full'}>
                닫기
              </DsButton>
              <DsButton onClick={onConfirm} className={'min-h-11 w-full'}>
                재시도
              </DsButton>
            </div>
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} aria-label="액션 확인" className={dialogClassName}>
      {stateSignal}
      <DialogTitle>{title}</DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
      <DialogBody className={dialogBodyClassName}>
        <DescriptionList>
          {Object.entries(preview).map(([k, v]) => (
            <div key={k}>
              <DescriptionTerm>{k}</DescriptionTerm>
              <DescriptionDetails>{v}</DescriptionDetails>
            </div>
          ))}
        </DescriptionList>
        <CheckboxField className={'mt-4'}>
          <Checkbox checked={agreed} onChange={setAgreed} />
          <span className={'text-body text-dotori-800 dark:text-dotori-100'}>위 내용이 맞습니다</span>
        </CheckboxField>
        <div className={'mt-4 flex w-full flex-col gap-3 sm:flex-row'}>
          <DsButton variant="ghost" onClick={onClose} className={'min-h-11 w-full'}>
            취소
          </DsButton>
          <DsButton
            disabled={!agreed}
            onClick={onConfirm}
            className={'min-h-11 w-full'}
          >
            확인
          </DsButton>
        </div>
      </DialogBody>
    </Dialog>
  )
}
