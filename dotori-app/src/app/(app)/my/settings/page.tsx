'use client'

/**
 * Settings Page — Premium polish (Wave 10)
 *
 * Catalyst: Listbox, ListboxOption, Alert, Switch
 * Primer:   ExpandableSection (AnimatePresence height toggle)
 * Motion:   FadeIn + spring
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronDownIcon,
  ArrowRightStartOnRectangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Heading, Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Avatar } from '@/components/catalyst/avatar'
import { Listbox, ListboxOption } from '@/components/catalyst/listbox'
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from '@/components/catalyst/alert'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { NotificationSettingsCard } from '@/components/dotori/NotificationSettingsCard'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { Field, Label } from '@/components/catalyst/fieldset'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { spring, scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'

const SIDO_LIST = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시',
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원특별자치도', '충청북도', '충청남도',
  '전북특별자치도', '전라남도', '경상북도', '경상남도',
  '제주특별자치도',
]

const NOTIFICATION_SETTINGS = [
  { id: 'vacancy', label: '빈자리 알림', description: '관심 시설에 TO 발생 시', defaultChecked: true },
  { id: 'document', label: '서류 마감 알림', description: '제출 서류 마감 D-3, D-1', defaultChecked: true },
  { id: 'community', label: '커뮤니티 알림', description: '내 글에 댓글·좋아요', defaultChecked: false },
  { id: 'marketing', label: '혜택·이벤트 알림', description: '프로모션 및 업데이트', defaultChecked: false },
]

function ExpandableSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'rounded-2xl ring-1 ring-dotori-200/30 dark:ring-dotori-800/30')}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-12 items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors hover:bg-dotori-950/[0.03] dark:hover:bg-white/[0.03]"
      >
        <Subheading level={2} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
          {title}
        </Subheading>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring.chip}
        >
          <ChevronDownIcon className="h-4 w-4 text-dotori-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SettingsPage() {
  const [region, setRegion] = useState<string>(SIDO_LIST[0])
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)

  return (
    <div className="relative space-y-5">
      <BrandWatermark className="opacity-30" />
      <BreadcrumbNav
        parent={{ label: '마이페이지', href: '/my' }}
        current="설정"
      />

      {/* ══════ PROFILE ══════ */}
      <FadeIn>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex items-center gap-4 rounded-2xl p-5 ring-1 ring-dotori-200/30 dark:ring-dotori-800/30')}>
          <Avatar
            initials="도"
            className="h-14 w-14 bg-dotori-100 text-dotori-700 dark:bg-dotori-900 dark:text-dotori-300"
            square
          />
          <div>
            <Heading level={2} className="text-base/7 font-semibold text-dotori-950 sm:text-base/7">
              게스트
            </Heading>
            <Text className="text-sm/6 text-dotori-500 sm:text-sm/6 dark:text-dotori-400">
              로그인하면 맞춤 서비스를 받아요
            </Text>
          </div>
        </div>
      </FadeIn>

      {/* ══════ NOTIFICATION SETTINGS ══════ */}
      <FadeIn>
        <ExpandableSection title="알림 설정" defaultOpen>
          <NotificationSettingsCard
            title="알림 종류"
            settings={NOTIFICATION_SETTINGS}
          />
        </ExpandableSection>
      </FadeIn>

      {/* ══════ REGION ══════ */}
      <motion.div {...scrollFadeIn}>
        <ExpandableSection title="지역 설정">
          <Field>
            <Label>관심 지역</Label>
            <Listbox value={region} onChange={setRegion}>
              {SIDO_LIST.map((sido) => (
                <ListboxOption key={sido} value={sido}>
                  {sido}
                </ListboxOption>
              ))}
            </Listbox>
          </Field>
        </ExpandableSection>
      </motion.div>

      {/* ══════ ACCOUNT ══════ */}
      <motion.div {...scrollFadeIn}>
        <ExpandableSection title="계정 관리">
          <FadeInStagger faster className="space-y-2">
            <FadeIn>
              <DsButton
                variant="secondary"
                fullWidth
                className="justify-start gap-3 rounded-xl"
              >
                <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                로그아웃
              </DsButton>
            </FadeIn>
            <FadeIn>
              <DsButton
                variant="ghost"
                fullWidth
                className="justify-start gap-3 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                onClick={() => setDeleteAlertOpen(true)}
              >
                <TrashIcon className="h-4 w-4" />
                계정 탈퇴
              </DsButton>
            </FadeIn>
          </FadeInStagger>
        </ExpandableSection>
      </motion.div>

      {/* ══════ DELETE ALERT ══════ */}
      <Alert open={deleteAlertOpen} onClose={() => setDeleteAlertOpen(false)}>
        <AlertTitle>정말 탈퇴하시겠어요?</AlertTitle>
        <AlertDescription>
          탈퇴하면 모든 데이터가 삭제되며 복구할 수 없어요. 저장한 관심 시설, 대기 목록, 서류 정보가 모두 사라집니다.
        </AlertDescription>
        <AlertActions>
          <DsButton variant="ghost" onClick={() => setDeleteAlertOpen(false)}>
            취소
          </DsButton>
          <DsButton
            color="red"
            onClick={() => setDeleteAlertOpen(false)}
          >
            탈퇴하기
          </DsButton>
        </AlertActions>
      </Alert>
    </div>
  )
}
