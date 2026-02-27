'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { cn } from '@/lib/utils'

interface Review {
  title: string
  body: string
  author: string
  rating: 1 | 2 | 3 | 4 | 5
}

const REVIEWS: Review[] = [
  {
    title: '검색이 진짜 편해요',
    body: '동네 어린이집 정보를 한눈에 비교할 수 있어서 이동 결정이 빨라졌어요. 대기 현황까지 알려줘서 좋아요.',
    author: '서울 3세맘',
    rating: 5,
  },
  {
    title: '유치원도 같이 검색돼요',
    body: '어린이집만 되는 줄 알았는데 유치원까지 통합 검색이 돼서 놀랐어요. 유보통합 시대에 딱이에요.',
    author: '경기 5세맘',
    rating: 5,
  },
  {
    title: '빈자리 알림이 최고',
    body: '관심 시설에 빈자리 나면 바로 알려줘서 빠르게 신청했어요. 알림 없었으면 놓칠 뻔했어요.',
    author: '인천 4세맘',
    rating: 5,
  },
  {
    title: '서류 준비가 간편해요',
    body: '입소 서류를 앱에서 체크리스트로 관리할 수 있어서 빠뜨리는 게 없어요. 2시간 걸릴 일이 10분이면 끝!',
    author: '대전 2세맘',
    rating: 5,
  },
  {
    title: 'AI 상담이 똑똑해요',
    body: '반편성 바뀌어서 고민이었는데, 토리한테 물어보니 바로 정리해줬어요. 이동 전략까지 짜줘서 감동.',
    author: '부산 3세맘',
    rating: 5,
  },
  {
    title: '국공립 비교가 쉬워요',
    body: '우리 동네 국공립 어린이집을 한 번에 비교할 수 있어요. 정원 대비 대기 수까지 볼 수 있어서 현실적이에요.',
    author: '광주 1세맘',
    rating: 5,
  },
  {
    title: '이동 후기가 도움돼요',
    body: '다른 부모님들의 시설 이동 후기를 보고 용기 얻었어요. 우리만 고민하는 게 아니더라고요.',
    author: '대구 4세맘',
    rating: 4,
  },
  {
    title: '동네 맞춤 추천이 좋아요',
    body: 'GPS 기반으로 실제 이동 가능한 시설만 추천해줘서 시간 낭비가 없어요. 현실적인 앱이에요.',
    author: '울산 2세맘',
    rating: 5,
  },
]

function StarIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function StarRating({ rating }: { rating: Review['rating'] }) {
  return (
    <div className="flex">
      {[...Array(5).keys()].map((index) => (
        <StarIcon
          key={index}
          className={cn(
            'h-4 w-4',
            rating > index ? 'fill-dotori-400' : 'fill-dotori-200 dark:fill-dotori-700',
          )}
        />
      ))}
    </div>
  )
}

function ReviewCard({
  title,
  body,
  author,
  rating,
  className: extraClassName,
  ...props
}: Review & React.ComponentPropsWithoutRef<'figure'>) {
  return (
    <figure
      className={cn(
        'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-dotori-100/50 dark:bg-dotori-950 dark:ring-dotori-800/50',
        extraClassName,
      )}
      {...props}
    >
      <blockquote>
        <StarRating rating={rating} />
        <p className="mt-2 text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">
          {title}
        </p>
        <p className="mt-1.5 text-caption leading-relaxed text-dotori-600 dark:text-dotori-300">
          {body}
        </p>
      </blockquote>
      <figcaption className="mt-2 text-label font-medium text-dotori-500 dark:text-dotori-400">
        {author}
      </figcaption>
    </figure>
  )
}

function MarqueeColumn({
  reviews,
  msPerPixel = 0,
  className,
}: {
  reviews: Review[]
  msPerPixel?: number
  className?: string
}) {
  const columnRef = useRef<HTMLDivElement>(null)
  const [columnHeight, setColumnHeight] = useState(0)
  const duration = `${columnHeight * msPerPixel}ms`

  useEffect(() => {
    if (!columnRef.current) return
    const observer = new ResizeObserver(() => {
      setColumnHeight(columnRef.current?.offsetHeight ?? 0)
    })
    observer.observe(columnRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={columnRef}
      className={cn('animate-marquee space-y-3 py-2', className)}
      style={{ '--marquee-duration': duration } as React.CSSProperties}
    >
      {reviews.concat(reviews).map((review, i) => (
        <ReviewCard key={i} aria-hidden={i >= reviews.length} {...review} />
      ))}
    </div>
  )
}

export interface ReviewMarqueeProps {
  className?: string
  /** Parent background for gradient edge fades. Must match parent bg. */
  fadeBg?: 'white' | 'dotori-50'
}

export function ReviewMarquee({ className, fadeBg = 'white' }: ReviewMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  const col1 = REVIEWS.slice(0, 4)
  const col2 = REVIEWS.slice(4)

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-80 max-h-[60vh] overflow-hidden',
        className,
      )}
    >
      {isInView && (
        <div className="grid grid-cols-2 gap-3">
          <MarqueeColumn reviews={col1} msPerPixel={12} />
          <MarqueeColumn reviews={col2} msPerPixel={16} className="mt-6" />
        </div>
      )}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b dark:from-dotori-950',
          fadeBg === 'dotori-50' ? 'from-dotori-50' : 'from-white',
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t dark:from-dotori-950',
          fadeBg === 'dotori-50' ? 'from-dotori-50' : 'from-white',
        )}
      />
    </div>
  )
}
