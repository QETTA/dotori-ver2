'use client'

import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {steps.map((label, i) => {
        const isCompleted = i < currentStep
        const isActive = i === currentStep
        const isPending = i > currentStep
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors',
                  isCompleted && 'bg-forest-500 text-white',
                  isActive && 'bg-dotori-500 text-white',
                  isPending && 'bg-dotori-100 text-dotori-400 dark:bg-dotori-800 dark:text-dotori-500',
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-center text-xs/4 font-medium',
                  isCompleted && 'text-forest-600 dark:text-forest-400',
                  isActive && 'text-dotori-700 dark:text-dotori-300',
                  isPending && DS_TEXT.muted,
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 flex-1 rounded-full transition-colors',
                  i < currentStep ? 'bg-gradient-to-r from-forest-500 to-dotori-500' : 'bg-dotori-200 dark:bg-dotori-700',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
