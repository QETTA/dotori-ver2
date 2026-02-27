'use client'

/**
 * ShareButton — Generic share button with Kakao → WebShare → Clipboard fallback.
 *
 * Automatically attaches UTM params to the shared URL.
 */
import { useState } from 'react'
import { ShareIcon, CheckIcon } from '@heroicons/react/24/outline'
import { motion } from 'motion/react'
import { tap } from '@/lib/motion'
import { shareViaKakao, type ShareParams } from '@/lib/kakao-share'
import { buildUTMUrl } from '@/lib/utm'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

export function ShareButton({
  title,
  description,
  path,
  campaign = 'share',
  imageUrl,
  className,
}: {
  title: string
  description: string
  path: string
  campaign?: string
  imageUrl?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const trackedUrl = buildUTMUrl(`${origin}${path}`, {
      source: 'kakao',
      medium: 'share',
      campaign,
    })

    const params: ShareParams = {
      title,
      description,
      linkUrl: trackedUrl,
      imageUrl,
      buttonTitle: '도토리에서 보기',
    }

    const result = await shareViaKakao(params)

    if (result.method === 'clipboard' && result.success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleShare}
      aria-label="공유하기"
      className={cn('inline-flex min-h-11 items-center gap-2 rounded-full bg-dotori-950/[0.025] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-dotori-950/[0.05] active:scale-[0.97] dark:bg-white/5 dark:hover:bg-white/10', DS_TEXT.secondary, className)}
      whileTap={tap.button.whileTap}
      transition={tap.button.transition}
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4 text-forest-500" />
          링크 복사됨
        </>
      ) : (
        <>
          <ShareIcon className="h-4 w-4" />
          공유하기
        </>
      )}
    </motion.button>
  )
}
