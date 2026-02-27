'use client'

/**
 * PhotoGallery — Horizontal snap scroll + fullscreen Dialog
 * Pattern: Radiant testimonials snap + Studio GrayscaleTransitionImage
 */
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { ease } from '@/lib/motion'

interface GalleryImage {
  src: string
  alt: string
}

export function PhotoGallery({
  images,
  className,
}: {
  images: GalleryImage[]
  className?: string
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (selectedIndex === null) return
      const next = selectedIndex + dir
      if (next >= 0 && next < images.length) setSelectedIndex(next)
    },
    [selectedIndex, images.length],
  )

  if (images.length === 0) return null

  return (
    <>
      {/* ── Thumbnail strip (snap scroll) ── */}
      <div
        ref={scrollRef}
        className={cn(
          'flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-2',
          '-mx-4 px-4',
          /* hide scrollbar */
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          className,
        )}
      >
        {images.map((img, i) => (
          <motion.button
            key={img.src}
            type="button"
            className={cn(
              'relative shrink-0 snap-start overflow-hidden rounded-xl',
              i === 0 ? 'h-44 w-full' : 'h-28 w-36',
            )}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedIndex(i)}
            aria-label={`사진 ${i + 1} 확대`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="h-full w-full object-cover transition-[filter] duration-500 hover:grayscale-0 sm:grayscale-[30%]"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {i === 0 && images.length > 1 && (
              <span className="absolute bottom-2 right-2 rounded-full bg-dotori-900/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                1/{images.length}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* ── Fullscreen lightbox ── */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-dotori-950/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: ease.out }}
            onClick={() => setSelectedIndex(null)}
            role="dialog"
            aria-label="사진 확대"
          >
            {/* Close */}
            <button
              type="button"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
              aria-label="닫기"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* Prev */}
            {selectedIndex > 0 && (
              <button
                type="button"
                className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); navigate(-1) }}
                aria-label="이전 사진"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}

            {/* Next */}
            {selectedIndex < images.length - 1 && (
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); navigate(1) }}
                aria-label="다음 사진"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}

            {/* Image */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={selectedIndex}
                className="max-h-[80vh] max-w-[90vw]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: ease.out }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[selectedIndex].src}
                  alt={images[selectedIndex].alt}
                  className="max-h-[80vh] rounded-lg object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {/* Counter */}
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-dotori-900/60 px-3 py-1 text-sm text-white backdrop-blur-sm">
              {selectedIndex + 1} / {images.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
