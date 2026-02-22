'use client'

import { Button } from '@/components/catalyst/button'
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
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { StreamingIndicator } from './StreamingIndicator'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/motion'

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
  const dialogClassName = cn(
    glass.sheet,
    '!bg-white/90 backdrop-blur-xl backdrop-saturate-150 !shadow-xl !ring-dotori-100/60',
    'dark:!bg-dotori-950/75 dark:!ring-dotori-700/40'
  )

  const dialogBodyClassName = cn(
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 duration-200'
  )

  if (status === 'executing') {
    return (
      <Dialog open={open} onClose={() => {}} aria-label="액션 확인" className={dialogClassName}>
        <DialogBody className={dialogBodyClassName}>
          <div className="flex flex-col items-center gap-3 py-8">
            <StreamingIndicator text="처리 중이에요..." />
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  if (status === 'success') {
    return (
      <Dialog open={open} onClose={onClose} aria-label="액션 확인" className={dialogClassName}>
        <DialogBody className={dialogBodyClassName}>
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircleIcon className="h-12 w-12 text-forest-500" />
            <p className="text-lg font-semibold text-dotori-900 dark:text-dotori-50">완료되었습니다</p>
            <Button color="dotori" onClick={onClose} className="min-h-11 w-full">
              확인
            </Button>
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  if (status === 'error') {
    return (
      <Dialog open={open} onClose={onClose} aria-label="액션 확인" className={dialogClassName}>
        <DialogBody className={dialogBodyClassName}>
          <div className="flex flex-col items-center gap-3 py-8">
            <ExclamationCircleIcon className="h-12 w-12 text-amber-700" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button plain={true} onClick={onClose} className="min-h-11 w-full">
                닫기
              </Button>
              <Button color="dotori" onClick={onConfirm} className="min-h-11 w-full">
                재시도
              </Button>
            </div>
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} aria-label="액션 확인" className={dialogClassName}>
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
        <CheckboxField className="mt-4">
          <Checkbox checked={agreed} onChange={setAgreed} />
          <span className="text-sm text-dotori-800 dark:text-dotori-100">위 내용이 맞습니다</span>
        </CheckboxField>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button plain={true} onClick={onClose} className="min-h-11 w-full">
            취소
          </Button>
          <Button color="dotori" disabled={!agreed} onClick={onConfirm} className="min-h-11 w-full">
            확인
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  )
}
