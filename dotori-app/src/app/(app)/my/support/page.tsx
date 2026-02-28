'use client'

/**
 * Support Page — 고객 지원 (R41 Premium Polish)
 *
 * Catalyst: Heading, Subheading, Text, DsButton
 * Studio:   FadeIn/FadeInStagger
 * Motion:   spring, hoverLift, scrollFadeIn, tap
 * DS:       DS_CARD, DS_PAGE_HEADER, BrandWatermark
 */
import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronDown,
  MessagesSquare,
  HelpCircle,
} from 'lucide-react'
import { Heading, Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { UiBlock as UiBlockCard } from '@/components/dotori/blocks/UiBlock'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'
import { spring, scrollFadeIn } from '@/lib/motion'
import { KAKAO_CHANNEL_CHAT_URL } from '@/lib/kakao-constants'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'
import type { UiBlock as UiBlockType } from '@/types/dotori'

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
    label: '1:1 채팅',
    sub: '평일 09:00~18:00',
    href: '/chat',
  },
  {
    label: '카카오톡 채널',
    sub: '채널 채팅으로 빠르게 문의',
    href: KAKAO_CHANNEL_CHAT_URL,
    badge: '카카오',
  },
]
const contactOptionsBlock: UiBlockType = {
  type: 'ui_block',
  title: '문의 채널',
  subtitle: '가장 편한 방법으로 바로 문의하세요',
  layout: 'grid',
  items: CONTACT_OPTIONS.map((opt) => ({
    id: `support-contact-${opt.label}`,
    title: opt.label,
    description: opt.sub,
    badge: opt.badge,
    href: opt.href,
    actionLabel: `${opt.label} 열기`,
  })),
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const triggerId = useId()
  const panelId = useId()

  return (
    <div className={cn(
      'rounded-2xl transition-all',
      open
        ? 'bg-dotori-50/80 ring-1 ring-dotori-200/50 dark:bg-dotori-900/40 dark:ring-dotori-700/40'
        : 'bg-dotori-950/[0.02] ring-1 ring-dotori-200/30 dark:bg-white/[0.02] dark:ring-dotori-700/40',
    )}>
      <button
        id={triggerId}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full min-h-12 items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors hover:bg-dotori-950/[0.03] dark:hover:bg-white/[0.03]"
      >
        <span className={cn('pr-4 font-semibold text-dotori-950 dark:text-dotori-50', DS_TYPOGRAPHY.bodySm)}>
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring.chip}
        >
          <ChevronDown className="h-4 w-4 shrink-0 text-dotori-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <Text className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-600 dark:text-dotori-400 leading-relaxed')}>
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
          <Heading className={cn('mt-3 font-wordmark font-bold', DS_PAGE_HEADER.title)}>
            도움이 필요하세요?
          </Heading>
          <Text className={cn('mt-2', DS_TYPOGRAPHY.body, DS_PAGE_HEADER.subtitle)}>
            자주 묻는 질문을 확인하거나 직접 문의해주세요.
          </Text>
        </FadeIn>
      </div>

      {/* ══════ CONTACT OPTIONS ══════ */}
      <FadeIn>
        <UiBlockCard block={contactOptionsBlock} />
      </FadeIn>

      {/* ══════ FAQ ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className="flex items-center gap-2 mb-4">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-dotori-100/60 dark:bg-dotori-800/30">
            <HelpCircle className="h-4 w-4 text-dotori-500" />
          </div>
          <Subheading level={2} className={cn(DS_TYPOGRAPHY.body, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
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
          <Text className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>
            원하는 답을 찾지 못하셨나요?
          </Text>
          <Text className={cn('mt-1', DS_TYPOGRAPHY.bodySm, 'text-dotori-500 dark:text-dotori-400')}>
            아래 버튼을 눌러 상담을 시작해보세요
          </Text>
          <DsButton href="/chat" className="mt-4">
            <MessagesSquare className="h-4 w-4" />
            상담 시작하기
          </DsButton>
        </div>
      </motion.div>

      {/* ══════ ToRI FAB ══════ */}
      <ToRiFAB prompt="도움이 필요해요" />
    </div>
  )
}
