'use client'

/**
 * InlineAlert — 인라인 배너 알림 (vacancy/info/warning)
 * AnimatePresence slide, XMarkIcon dismiss
 */
import { XMarkIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { DS_TEXT } from '@/lib/design-system/tokens'

const variants = {
  vacancy: {
    container: 'bg-forest-50 text-forest-900 ring-forest-200/60 dark:bg-forest-950/20 dark:text-forest-100 dark:ring-forest-700/30',
    icon: 'text-forest-600 dark:text-forest-400',
  },
  info: {
    container: 'bg-dotori-50 text-dotori-900 ring-dotori-200/60 dark:bg-dotori-950/20 dark:text-dotori-100 dark:ring-dotori-700/30',
    icon: DS_TEXT.muted,
  },
  warning: {
    container: 'bg-amber-50 text-amber-900 ring-amber-200/60 dark:bg-amber-950/20 dark:text-amber-100 dark:ring-amber-700/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
} as const

export function InlineAlert({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  show = true,
  className,
}: {
  variant: 'vacancy' | 'info' | 'warning'
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
  show?: boolean
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const style = variants[variant]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          role="alert"
          className={cn(
            'flex items-start gap-3 rounded-xl p-4 ring-1 ring-inset',
            style.container,
            className,
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm/6 font-semibold">{title}</p>
            {description && (
              <p className="mt-1 text-sm/6 opacity-80">{description}</p>
            )}
            {actionLabel && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="mt-2 text-sm/6 font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                {actionLabel}
              </button>
            )}
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="닫기"
              className={cn(
                'shrink-0 rounded-lg p-1 transition-opacity hover:opacity-70',
                style.icon,
              )}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
