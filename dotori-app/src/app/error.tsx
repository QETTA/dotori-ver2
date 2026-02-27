'use client'

/**
 * Global Error Boundary — Wave 9 Polish
 * InlineAlert + retry button
 */
import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { copy } from '@/lib/brand-copy'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to analytics
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <BrandEmptyIllustration variant="error" size={96} />
        <Heading level={2} className="mt-6 text-lg font-semibold text-dotori-950 dark:text-dotori-50">
          {copy.global.error.title}
        </Heading>
        <Text className="mt-2 text-sm text-dotori-600 dark:text-dotori-400">
          {copy.global.error.description}
        </Text>
        {error.digest && (
          <Text className="mt-2 font-mono text-xs text-dotori-400">
            오류 코드: {error.digest}
          </Text>
        )}
        <div className="mt-6">
          <DsButton onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {copy.global.error.retry}
          </DsButton>
        </div>
      </div>
    </div>
  )
}
