'use client'

/**
 * Support Page — 고객 지원 (R41 Premium Polish)
 *
 * Catalyst: Heading, Subheading, Text, DsButton
 * Studio:   FadeIn/FadeInStagger
 * Motion:   spring, hoverLift, scrollFadeIn, tap
 * DS:       DS_CARD, DS_PAGE_HEADER, BrandWatermark
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { Heading, Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'
import { spring, hoverLift, scrollFadeIn } from '@/lib/motion'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'

const FAQ_ITEMS = [
  {
    question: '빈자리 알림은 어떻게 받나요?',
    answer: '관심 시설을 등록하면 해당 시설에 TO가 발생할 때 푸시 알림을 보내드려요. 마이페이지 > 설정에서 알림을 켜주세요.',
  },
  {
    question: '입소 서류는 어떤 것을 준비해야 하나요?',
    answer: '건강검진 결과서, 주민등록등본, 예방접종 증명서가 기본 서류예요. 시설 유형에 따라 추가 서류가 필요할 수 있어요.',
  },
  {
    question: '유보통합이란 무엇인가요?',
    answer: '어린이집(보육)과 유치원(교육)을 하나의 체계로 통합하는 정책이에요. 도토리는 유보통합 시행에 맞춰 두 시설을 통합 검색할 수 있어요.',
  },
  {
    question: '대기 순위는 어떻게 확인하나요?',
    answer: '마이페이지 > 입소 대기에서 신청한 시설의 대기 순위를 실시간으로 확인할 수 있어요.',
  },
  {
    question: '토리 톡은 무엇인가요?',
    answer: 'AI 이동 전략 상담 서비스예요. 아이의 나이와 지역을 알려주시면 맞춤 시설 추천부터 입소 전략까지 안내해드려요.',
  },
]

const CONTACT_OPTIONS = [
  {
    Icon: ChatBubbleLeftRightIcon,
    label: '1:1 채팅',
    sub: '평일 09:00~18:00',
    accent: 'bg-dotori-100/80 dark:bg-dotori-800/40',
  },
  {
    Icon: EnvelopeIcon,
    label: '이메일 문의',
    sub: '24시간 접수',
    accent: 'bg-forest-50/80 dark:bg-forest-900/30',
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn(
      'rounded-2xl transition-all',
      open
        ? 'bg-dotori-50/80 ring-1 ring-dotori-200/50 dark:bg-dotori-900/40 dark:ring-dotori-700/40'
        : 'bg-dotori-950/[0.02] ring-1 ring-dotori-200/30 dark:bg-white/[0.02] dark:ring-dotori-800/30',
    )}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-12 items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors hover:bg-dotori-950/[0.03] dark:hover:bg-white/[0.03]"
      >
        <Text className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6 dark:text-dotori-50 pr-4">
          {question}
        </Text>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring.chip}
        >
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-dotori-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <Text className="text-sm/6 text-dotori-600 sm:text-sm/6 dark:text-dotori-400 leading-relaxed">
                {answer}
              </Text>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav
        parent={{ label: '마이페이지', href: '/my' }}
        current="고객 지원"
      />

      {/* ══════ INTRO + BRAND ══════ */}
      <div className="relative">
        <BrandWatermark className="opacity-50" />
        <FadeIn>
          <p className={DS_PAGE_HEADER.eyebrow}>고객 지원</p>
          <Heading className="mt-3 font-wordmark text-3xl/10 font-bold tracking-tight text-dotori-950 sm:text-3xl/10">
            도움이 필요하세요?
          </Heading>
          <Text className="mt-2 text-base/7 text-dotori-600 dark:text-dotori-400">
            자주 묻는 질문을 확인하거나 직접 문의해주세요.
          </Text>
        </FadeIn>
      </div>

      {/* ══════ CONTACT OPTIONS (hoverLift) ══════ */}
      <FadeIn>
        <div className="grid grid-cols-2 gap-3">
          {CONTACT_OPTIONS.map((opt) => (
            <motion.div key={opt.label} {...hoverLift}>
              <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'flex flex-col items-center gap-2.5 p-5')}>
                <div className={cn('grid h-10 w-10 place-items-center rounded-xl', opt.accent)}>
                  <opt.Icon className="h-5 w-5 text-dotori-500" />
                </div>
                <Subheading level={3} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
                  {opt.label}
                </Subheading>
                <Text className="text-center text-caption text-dotori-500 dark:text-dotori-400">
                  {opt.sub}
                </Text>
              </div>
            </motion.div>
          ))}
        </div>
      </FadeIn>

      {/* ══════ FAQ ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className="flex items-center gap-2 mb-4">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-dotori-100/60 dark:bg-dotori-800/30">
            <QuestionMarkCircleIcon className="h-4 w-4 text-dotori-500" />
          </div>
          <Subheading level={2} className="text-base/7 font-semibold text-dotori-950 sm:text-base/7">
            자주 묻는 질문
          </Subheading>
        </div>
      </motion.div>
      <FadeInStagger faster className="space-y-2">
        {FAQ_ITEMS.map((item) => (
          <FadeIn key={item.question}>
            <FaqItem question={item.question} answer={item.answer} />
          </FadeIn>
        ))}
      </FadeInStagger>

      {/* ══════ STILL NEED HELP ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-6 text-center')}>
          <Text className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6 dark:text-dotori-50">
            원하는 답을 찾지 못하셨나요?
          </Text>
          <Text className="mt-1 text-sm/6 text-dotori-500 sm:text-sm/6 dark:text-dotori-400">
            아래 버튼을 눌러 상담을 시작해보세요
          </Text>
          <DsButton className="mt-4">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            상담 시작하기
          </DsButton>
        </div>
      </motion.div>

      {/* ══════ ToRI FAB ══════ */}
      <ToRiFAB prompt="도움이 필요해요" />
    </div>
  )
}
