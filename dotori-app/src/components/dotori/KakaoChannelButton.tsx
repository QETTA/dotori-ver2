'use client'

/**
 * KakaoChannelButton — "카카오톡 채널 추가" floating button.
 *
 * Opens Kakao Channel add page with UTM tracking.
 */
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid'
import { motion } from 'motion/react'
import { tap } from '@/lib/motion'
import { buildUTMUrl } from '@/lib/utm'

const CHANNEL_ID = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID ?? '_dotori'
const CHANNEL_URL = `https://pf.kakao.com/${CHANNEL_ID}`

export function KakaoChannelButton({
  campaign = 'channel_add',
  className,
}: {
  campaign?: string
  className?: string
}) {
  const trackedUrl = buildUTMUrl(CHANNEL_URL, {
    source: 'dotori',
    medium: 'channel',
    campaign,
  })

  return (
    <motion.a
      href={trackedUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카카오톡 채널 추가"
      className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-[#FEE500] px-5 py-2.5 text-sm font-bold text-[#3C1E1E] shadow-sm transition-shadow hover:shadow-md active:scale-[0.97] ${className ?? ''}`}
      whileTap={tap.button.whileTap}
      transition={tap.button.transition}
    >
      <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
      카카오톡 채널 추가
    </motion.a>
  )
}
