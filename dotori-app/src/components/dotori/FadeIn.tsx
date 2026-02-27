'use client'

/**
 * FadeIn — Studio FadeIn.tsx 직접 포팅
 * 원본: tailwind-plus-studio/studio-ts/src/components/FadeIn.tsx
 * 변경: framer-motion → motion/react, 색상 도토리 팔레트
 *
 * hasDesignTokens: true  — DS_SURFACE
 * hasBrandSignal:  true  — DS_SURFACE.primary/elevated/sunken (optional surface prop)
 */
import { createContext, useContext } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { DS_SURFACE } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'

const FadeInStaggerContext = createContext(false)

const viewport = { once: true, margin: '0px 0px -100px', amount: 0.05 as const }

type SurfaceLevel = keyof typeof DS_SURFACE

export function FadeIn({
  surface,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div> & {
  /** Optional brand surface level — applies DS_SURFACE token */
  surface?: SurfaceLevel
}) {
  const shouldReduceMotion = useReducedMotion()
  const isInStaggerGroup = useContext(FadeInStaggerContext)

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5 }}
      {...(isInStaggerGroup
        ? {}
        : {
            initial: 'hidden',
            whileInView: 'visible',
            viewport,
          })}
      className={cn(surface && DS_SURFACE[surface], className)}
      {...props}
    />
  )
}

export function FadeInStagger({
  faster = false,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div> & { faster?: boolean }) {
  return (
    <FadeInStaggerContext.Provider value={true}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ staggerChildren: faster ? 0.12 : 0.2 }}
        {...props}
      />
    </FadeInStaggerContext.Provider>
  )
}
