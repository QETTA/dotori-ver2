'use client'

import { useState, useCallback } from 'react'
import { Text } from '@/components/catalyst/text'
import { cn } from '@/lib/utils'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { Check } from 'lucide-react'

interface Clause {
  id: string
  label: string
  required: boolean
}

interface LegalClausesPanelProps {
  clauses: Clause[]
  onAllAgreed: (allAgreed: boolean) => void
  className?: string
}

export function LegalClausesPanel({ clauses, onAllAgreed, className }: LegalClausesPanelProps) {
  const [agreed, setAgreed] = useState<Set<string>>(new Set())

  const allRequired = clauses.filter((c) => c.required)
  const allRequiredAgreed = allRequired.every((c) => agreed.has(c.id))

  const toggleClause = useCallback((id: string) => {
    setAgreed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      const allReq = clauses.filter((c) => c.required).every((c) => next.has(c.id))
      onAllAgreed(allReq)
      return next
    })
  }, [clauses, onAllAgreed])

  const toggleAll = useCallback(() => {
    if (agreed.size === clauses.length) {
      setAgreed(new Set())
      onAllAgreed(false)
    } else {
      setAgreed(new Set(clauses.map((c) => c.id)))
      onAllAgreed(true)
    }
  }, [clauses, agreed.size, onAllAgreed])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Master toggle */}
      <button
        type="button"
        onClick={toggleAll}
        className={cn(
          DS_CARD.flat.base, DS_CARD.flat.dark,
          'flex w-full items-center gap-3 p-4 text-left transition-colors',
        )}
      >
        <div
          className={cn(
            'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors',
            agreed.size === clauses.length
              ? 'border-dotori-500 bg-dotori-500 text-white'
              : 'border-dotori-300 dark:border-dotori-600',
          )}
        >
          {agreed.size === clauses.length && <Check className="h-4 w-4" />}
        </div>
        <Text className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
          모두 동의합니다
        </Text>
      </button>

      {/* Individual clauses */}
      {clauses.map((clause) => (
        <button
          key={clause.id}
          type="button"
          onClick={() => toggleClause(clause.id)}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-dotori-50 dark:hover:bg-dotori-900/50"
        >
          <div
            className={cn(
              'grid h-5 w-5 shrink-0 place-items-center rounded border-2 transition-colors',
              agreed.has(clause.id)
                ? 'border-dotori-500 bg-dotori-500 text-white'
                : 'border-dotori-300 dark:border-dotori-600',
            )}
          >
            {agreed.has(clause.id) && <Check className="h-3 w-3" />}
          </div>
          <Text className="text-sm/6 text-dotori-700 sm:text-sm/6 dark:text-dotori-300">
            {clause.required && <span className="mr-1 text-red-500">(필수)</span>}
            {clause.label}
          </Text>
        </button>
      ))}

      {!allRequiredAgreed && (
        <Text className="text-xs/5 text-dotori-400 sm:text-xs/5">
          필수 항목에 모두 동의해야 진행할 수 있습니다.
        </Text>
      )}
    </div>
  )
}
