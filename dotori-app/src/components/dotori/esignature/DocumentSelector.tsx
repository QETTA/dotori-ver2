'use client'

import { Text } from '@/components/catalyst/text'
import { Badge } from '@/components/catalyst/badge'
import { cn } from '@/lib/utils'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export interface SelectableDocument {
  id: string
  title: string
  type: string
  status: string
}

interface DocumentSelectorProps {
  documents: SelectableDocument[]
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}

const STATUS_LABELS: Record<string, { label: string; color: 'zinc' | 'amber' | 'green' }> = {
  draft: { label: '초안', color: 'zinc' },
  pending: { label: '대기', color: 'amber' },
  signed: { label: '서명됨', color: 'green' },
}

export function DocumentSelector({ documents, selectedId, onSelect, className }: DocumentSelectorProps) {
  if (documents.length === 0) {
    return (
      <Text className="py-8 text-center text-sm/6 text-dotori-500 sm:text-sm/6">
        서명 가능한 서류가 없습니다.
      </Text>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {documents.map((doc) => {
        const isSelected = doc.id === selectedId
        const statusInfo = STATUS_LABELS[doc.status] ?? STATUS_LABELS.draft
        return (
          <button
            key={doc.id}
            type="button"
            onClick={() => onSelect(doc.id)}
            className={cn(
              DS_CARD.flat.base, DS_CARD.flat.dark,
              'flex w-full items-center gap-3 p-4 text-left transition-all',
              isSelected && 'ring-2 ring-dotori-500',
            )}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-dotori-950/[0.025] dark:bg-white/[0.04]">
              <DocumentTextIcon className="h-5 w-5 text-dotori-500" />
            </div>
            <div className="min-w-0 flex-1">
              <Text className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6 dark:text-dotori-50">
                {doc.title}
              </Text>
              <Text className="text-xs/5 text-dotori-500 sm:text-xs/5">
                {doc.type}
              </Text>
            </div>
            <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
          </button>
        )
      })}
    </div>
  )
}
