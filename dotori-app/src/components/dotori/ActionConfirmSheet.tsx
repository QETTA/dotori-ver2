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
  const dialogPanelClassName = cn(
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 duration-200'
  )

  if (status === 'executing') {
    return (
      <Dialog open={open} onClose={() => {}} aria-label="액션 확인">
        <DialogBody className={dialogPanelClassName}>
          <div className="flex flex-col items-center gap-3 py-8">
            <StreamingIndicator text="처리 중이에요..." />
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  if (status === 'success') {
    return (
      <Dialog open={open} onClose={onClose} aria-label="액션 확인">
        <DialogBody className={dialogPanelClassName}>
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircleIcon className="h-12 w-12 text-forest-500" />
            <p className="text-lg font-semibold">완료되었습니다</p>
            <Button color="dotori" onClick={onClose}>
              확인
            </Button>
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  if (status === 'error') {
    return (
      <Dialog open={open} onClose={onClose} aria-label="액션 확인">
        <DialogBody className={dialogPanelClassName}>
          <div className="flex flex-col items-center gap-3 py-8">
            <ExclamationCircleIcon className="h-12 w-12 text-amber-700" />
            <p className="text-[15px] text-amber-800">{error}</p>
            <div className="flex gap-3">
              <Button plain onClick={onClose}>
                닫기
              </Button>
              <Button color="dotori" onClick={onConfirm}>
                재시도
              </Button>
            </div>
          </div>
        </DialogBody>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} aria-label="액션 확인">
      <DialogTitle>{title}</DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
      <DialogBody className={dialogPanelClassName}>
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
          <span className="text-[15px]">위 내용이 맞습니다</span>
        </CheckboxField>
        <div className="mt-4 flex gap-3">
          <Button plain onClick={onClose}>
            취소
          </Button>
          <Button color="dotori" disabled={!agreed} onClick={onConfirm}>
            확인
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  )
}
