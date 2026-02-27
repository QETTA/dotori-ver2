'use client'

/**
 * BentoCard — Radiant bento-card.tsx 직접 포팅
 * 원본: tailwind-plus-radiant/radiant-ts/src/components/bento-card.tsx
 * 변경: framer-motion → motion/react, gray → dotori, Subheading inline
 */
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

export function BentoCard({
  dark = false,
  className = '',
  eyebrow,
  title,
  description,
  graphic,
  fade = [],
}: {
  dark?: boolean
  className?: string
  eyebrow: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  graphic?: React.ReactNode
  fade?: ('top' | 'bottom')[]
}) {
  return (
    <motion.div
      initial="idle"
      whileHover="active"
      variants={{ idle: {}, active: {} }}
      data-dark={dark ? 'true' : undefined}
      className={cn(
        className,
        'group relative flex flex-col overflow-hidden rounded-lg',
        'bg-white shadow-xs ring-1 ring-black/5',
        'data-dark:bg-dotori-900 data-dark:ring-white/15',
      )}
    >
      {graphic && (
        <div className="relative h-80 shrink-0">
          {graphic}
          {fade.includes('top') && (
            <div className="absolute inset-0 bg-gradient-to-b from-white to-50% group-data-[dark]:from-dotori-900 group-data-[dark]:from-[-25%]" />
          )}
          {fade.includes('bottom') && (
            <div className="absolute inset-0 bg-gradient-to-t from-white to-50% group-data-[dark]:from-dotori-900 group-data-[dark]:from-[-25%]" />
          )}
        </div>
      )}
      <div className="relative p-10">
        <h3 className="font-mono text-xs/5 font-semibold uppercase tracking-widest text-dotori-500 group-data-[dark]:text-dotori-400">
          {eyebrow}
        </h3>
        <p className="mt-1 text-2xl/8 font-medium tracking-tight text-dotori-950 group-data-[dark]:text-white">
          {title}
        </p>
        <p className="mt-2 max-w-[600px] text-sm/6 text-dotori-600 group-data-[dark]:text-dotori-400">
          {description}
        </p>
      </div>
    </motion.div>
  )
}
