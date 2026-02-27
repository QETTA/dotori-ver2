'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'

export default function LandingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Landing route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-dotori-900 px-4" role="status">
      <div className="w-full max-w-sm text-center">
        <BrandEmptyIllustration variant="error" size={96} />
        <Heading level={2} className="mt-6 text-lg font-semibold text-dotori-50">
          페이지를 불러오지 못했어요
        </Heading>
        <Text className="mt-2 text-sm text-dotori-300">
          잠시 후 새로고침해주세요.
        </Text>
        {error.digest && (
          <Text className="mt-2 font-mono text-xs text-dotori-500">
            오류 코드: {error.digest}
          </Text>
        )}
        <div className="mt-6">
          <DsButton onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            새로고침
          </DsButton>
        </div>
      </div>
    </div>
  )
}
