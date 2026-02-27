'use client'

import { useEffect } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Auth route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4" role="status">
      <div className="w-full max-w-sm text-center">
        <BrandEmptyIllustration variant="error" size={96} />
        <Heading level={2} className="mt-6 text-lg font-semibold text-dotori-950 dark:text-dotori-50">
          로그인 중 문제가 발생했어요
        </Heading>
        <Text className="mt-2 text-sm text-dotori-600 dark:text-dotori-400">
          잠시 후 다시 시도해주세요. 계속되면 다시 로그인해보세요.
        </Text>
        {error.digest && (
          <Text className="mt-2 font-mono text-xs text-dotori-400">
            오류 코드: {error.digest}
          </Text>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <DsButton onClick={reset} className="gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            다시 시도
          </DsButton>
          <DsButton href="/login" variant="ghost" className="gap-2">
            다시 로그인
          </DsButton>
        </div>
      </div>
    </div>
  )
}
