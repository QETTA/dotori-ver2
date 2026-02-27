'use client'

/**
 * StarFieldBg — Commit StarField 직접 포팅
 * 원본: tailwind-plus-commit/commit-ts/src/components/StarField.tsx
 * canvas RAF 파티클 애니메이션, useReducedMotion 정지, ResizeObserver
 */
import { useRef, useEffect, useCallback } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
}

export function StarFieldBg({
  className,
  density = 80,
  speed = 0.3,
}: {
  className?: string
  density?: number
  speed?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef<number>(0)
  const shouldReduceMotion = useReducedMotion()

  const initStars = useCallback(
    (width: number, height: number) => {
      const count = Math.floor((width * height) / (10000 / density) * 10)
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        speed: (Math.random() * 0.5 + 0.5) * speed,
      }))
    },
    [density, speed],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      initStars(rect.width, rect.height)
    }

    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    if (shouldReduceMotion) {
      // Draw one static frame
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      for (const star of starsRef.current) {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
      }
      return () => ro.disconnect()
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)

      for (const star of starsRef.current) {
        star.y -= star.speed
        if (star.y < -2) {
          star.y = h + 2
          star.x = Math.random() * w
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [shouldReduceMotion, initStars])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    />
  )
}
