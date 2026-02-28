'use client'

/**
 * Settings Page — Premium polish (Wave 10)
 *
 * Catalyst: Listbox, ListboxOption, Alert, Switch
 * Primer:   ExpandableSection (AnimatePresence height toggle)
 * Motion:   FadeIn + spring
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronDown,
  LogOut,
  Save,
  Trash2,
} from 'lucide-react'
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
import { useToast } from '@/components/dotori/ToastProvider'
import { Field, Label } from '@/components/catalyst/fieldset'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { apiFetch } from '@/lib/api'
import { spring, scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { NotificationSettings, UserProfile } from '@/types/dotori'

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
    <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'group/card rounded-2xl ring-1 ring-dotori-200/30 dark:ring-dotori-800/30')}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-12 items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors hover:bg-dotori-950/[0.03] dark:hover:bg-white/[0.03]"
      >
        <Subheading level={2} className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950')}>
          {title}
        </Subheading>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring.chip}
        >
          <ChevronDown className="h-4 w-4 text-dotori-400" />
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

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  vacancy: true,
  document: true,
  community: false,
  marketing: false,
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const isAuthenticated = user !== null
  const { addToast } = useToast()
  const [region, setRegion] = useState<string>(SIDO_LIST[0])
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const initializedRef = useRef(false)

  // Load profile on mount (client-only)
  useEffect(() => {
    if (initializedRef.current) return
    let cancelled = false
    apiFetch<{ data: UserProfile }>('/api/users/me')
      .then((res) => {
        if (cancelled) return
        initializedRef.current = true
        const profile = res.data
        setUser(profile)
        if (profile.region?.sido) setRegion(profile.region.sido)
        if (profile.notificationSettings) setNotifSettings(profile.notificationSettings)
      })
      .catch(() => {
        // Not authenticated or network error — stay as guest
      })
    return () => { cancelled = true }
  }, [])

  const handleNotifChange = useCallback((values: Record<string, boolean>) => {
    setNotifSettings({
      vacancy: values.vacancy ?? DEFAULT_NOTIFICATION_SETTINGS.vacancy,
      document: values.document ?? DEFAULT_NOTIFICATION_SETTINGS.document,
      community: values.community ?? DEFAULT_NOTIFICATION_SETTINGS.community,
      marketing: values.marketing ?? DEFAULT_NOTIFICATION_SETTINGS.marketing,
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      addToast({ type: 'info', message: '로그인 후 설정을 저장할 수 있어요' })
      return
    }
    setIsSaving(true)
    try {
      const res = await apiFetch<{ data: UserProfile }>('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: { sido: region, sigungu: '', dong: '' },
          notificationSettings: notifSettings,
        }),
      })
      setUser(res.data)
      addToast({ type: 'success', message: '설정이 저장되었어요' })
    } catch {
      addToast({ type: 'error', message: '저장에 실패했어요. 다시 시도해주세요' })
    } finally {
      setIsSaving(false)
    }
  }, [isAuthenticated, region, notifSettings, addToast])

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
            initials={user?.nickname?.charAt(0) || '도'}
            src={user?.image}
            className="h-14 w-14 bg-dotori-100 text-dotori-700 dark:bg-dotori-900 dark:text-dotori-300"
            square
          />
          <div>
            <Heading level={2} className={cn(DS_TYPOGRAPHY.body, 'font-semibold text-dotori-950')}>
              {user?.nickname || '게스트'}
            </Heading>
            <Text className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-500 dark:text-dotori-400')}>
              {isAuthenticated ? '프로필 설정을 관리하세요' : '로그인하면 맞춤 서비스를 받아요'}
            </Text>
          </div>
        </div>
      </FadeIn>

      {/* ══════ NOTIFICATION SETTINGS ══════ */}
      <FadeIn>
        <ExpandableSection title="알림 설정" defaultOpen>
          <NotificationSettingsCard
            key={user ? 'loaded' : 'default'}
            title="알림 종류"
            settings={NOTIFICATION_SETTINGS.map((s) => ({
              ...s,
              defaultChecked: notifSettings[s.id as keyof NotificationSettings] ?? s.defaultChecked,
            }))}
            onChange={handleNotifChange}
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

      {/* ══════ SAVE BUTTON ══════ */}
      <FadeIn>
        <DsButton
          onClick={handleSave}
          disabled={isSaving}
          fullWidth
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? '저장 중...' : '설정 저장'}
        </DsButton>
      </FadeIn>

      {/* ══════ ACCOUNT ══════ */}
      <motion.div {...scrollFadeIn}>
        <ExpandableSection title="계정 관리">
          <FadeInStagger faster className="space-y-2">
            <FadeIn>
              <DsButton
                variant="secondary"
                fullWidth
                className="justify-start gap-3 rounded-xl"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="h-4 w-4" />
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
                <Trash2 className="h-4 w-4" />
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
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true)
              try {
                await apiFetch('/api/users/me/delete', { method: 'DELETE' })
                addToast({ type: 'success', message: '계정이 삭제되었어요' })
                setDeleteAlertOpen(false)
                signOut({ callbackUrl: '/login' })
              } catch {
                addToast({ type: 'error', message: '계정 삭제에 실패했어요' })
                setIsDeleting(false)
              }
            }}
          >
            {isDeleting ? '처리 중...' : '탈퇴하기'}
          </DsButton>
        </AlertActions>
      </Alert>
    </div>
  )
}
