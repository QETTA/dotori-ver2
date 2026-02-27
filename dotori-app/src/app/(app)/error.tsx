'use client'

import { useEffect } from 'react'
import { ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline'
import { copy } from '@/lib/brand-copy'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4" role="status">
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
        <div className="mt-6 flex items-center justify-center gap-3">
          <DsButton onClick={reset} className="gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            {copy.global.error.retry}
          </DsButton>
          <DsButton href="/" variant="ghost" className="gap-2">
            <HomeIcon className="h-4 w-4" />
            홈으로
          </DsButton>
        </div>
      </div>
    </div>
  )
}
