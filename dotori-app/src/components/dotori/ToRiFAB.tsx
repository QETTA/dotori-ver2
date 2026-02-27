'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { DS_FAB, DS_TEXT } from '@/lib/design-system/tokens'
import { spring } from '@/lib/motion'

interface ToRiFABProps {
  prompt?: string
  className?: string
}

export function ToRiFAB({ prompt, className = '' }: ToRiFABProps) {
  const router = useRouter()

  const handleClick = () => {
    const params = prompt ? `?q=${encodeURIComponent(prompt)}` : ''
    router.push(`/chat${params}`)
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ ...spring.card, delay: 0.5 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`${DS_FAB.base} ${DS_FAB.dotori} ${className}`}
      aria-label="토리챗 열기"
    >
      <SparklesIcon className={`h-6 w-6 ${DS_TEXT.inverse}`} />
    </motion.button>
  )
}
