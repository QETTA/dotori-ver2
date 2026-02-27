'use client'

/**
 * Community Write Page — Premium polish (R41)
 *
 * Catalyst: Textarea, Radio, RadioGroup, RadioField
 * Studio:   FadeIn/FadeInStagger, motion tap/stagger
 * DS:       DS_CARD, DS_PAGE_HEADER, BrandWatermark
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Fieldset, Field, Label, Description } from '@/components/catalyst/fieldset'
import { Input } from '@/components/catalyst/input'
import { Textarea } from '@/components/catalyst/textarea'
import { RadioGroup, RadioField, Radio } from '@/components/catalyst/radio'
import { SwitchField, Switch } from '@/components/catalyst/switch'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { InlineAlert } from '@/components/dotori/InlineAlert'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { FacilityTagInput } from '@/components/dotori/FacilityTagInput'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'
import { tap, scrollFadeIn } from '@/lib/motion'
import { apiFetch } from '@/lib/api'

const CATEGORIES = ['이동 후기', '시설 정보', '유보통합', '자유글']
const CATEGORY_ICONS = ['💬', '🏫', '🤝', '✍️']

const CATEGORY_MAP: Record<string, string> = {
  '이동 후기': 'review',
  '시설 정보': 'info',
  '유보통합': 'question',
  '자유글': 'feedback',
}

const MAX_CONTENT_LENGTH = 2000

export default function CommunityWritePage() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [content, setContent] = useState('')
  const [facilityTags, setFacilityTags] = useState<{ id: string; name: string }[]>([])
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await apiFetch('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: CATEGORY_MAP[category] ?? 'feedback',
          facilityTags: facilityTags.map(t => t.name),
          anonymous,
        }),
      })
      router.push('/community')
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시에 실패했어요. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <BreadcrumbNav
        parent={{ label: '커뮤니티', href: '/community' }}
        current="글쓰기"
        action={
          <DsButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '게시 중...' : '게시'}
          </DsButton>
        }
      />

      {/* ══════ INTRO + BRAND ══════ */}
      <div className="relative">
        <BrandWatermark className="opacity-50" />
        <FadeIn>
          <p className={DS_PAGE_HEADER.eyebrow}>글쓰기</p>
          <Heading className="mt-3 font-wordmark text-3xl/10 font-bold tracking-tight text-dotori-950 sm:text-3xl/10">
            이야기 나누기
          </Heading>
          <Text className="mt-2 text-base/7 text-dotori-600 dark:text-dotori-400">
            이동 경험, 시설 정보 등 자유롭게 공유해주세요.
          </Text>
        </FadeIn>
      </div>

      {/* ══════ CATEGORY PILLS (motion tap) ══════ */}
      <FadeIn>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-5')}>
          <Text className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6 dark:text-dotori-50">카테고리</Text>
          <RadioGroup
            value={category}
            onChange={setCategory}
            className="mt-3 flex flex-wrap gap-2"
          >
            {CATEGORIES.map((cat, i) => (
              <RadioField key={cat} className="contents">
                <Radio value={cat} className="peer sr-only" />
                <motion.div {...tap.chip}>
                  <Label className="flex cursor-pointer items-center gap-1 rounded-full border border-dotori-200 px-3 py-1.5 text-xs/5 font-medium text-dotori-600 transition-all peer-data-checked:border-dotori-500 peer-data-checked:bg-dotori-500 peer-data-checked:text-white peer-data-checked:shadow-sm peer-data-checked:shadow-dotori-500/25 dark:border-dotori-700 dark:text-dotori-400 dark:peer-data-checked:border-dotori-400 dark:peer-data-checked:bg-dotori-500 dark:peer-data-checked:text-white">
                    <span>{CATEGORY_ICONS[i]}</span>
                    {cat}
                  </Label>
                </motion.div>
              </RadioField>
            ))}
          </RadioGroup>
        </div>
      </FadeIn>

      {/* ══════ FORM CARD ══════ */}
      <motion.div {...scrollFadeIn}>
        <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'p-5')}>
          <FadeInStagger faster>
            <Fieldset>
              {/* TITLE */}
              <FadeIn>
                <Field>
                  <Label>제목</Label>
                  <Input
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Field>
              </FadeIn>

              <FadeIn>
                <Divider soft className="my-5" />
              </FadeIn>

              {/* CONTENT */}
              <FadeIn>
                <Field>
                  <Label>내용</Label>
                  <Textarea
                    rows={8}
                    placeholder="이동 경험, 시설 정보 등 자유롭게 작성해주세요"
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                  />
                  <div className="mt-2 flex justify-end">
                    <Text className={cn(
                      'text-xs/5',
                      content.length > MAX_CONTENT_LENGTH * 0.9
                        ? 'text-red-500'
                        : 'text-dotori-400 dark:text-dotori-500',
                    )}>
                      {content.length}/{MAX_CONTENT_LENGTH}
                    </Text>
                  </div>
                </Field>
              </FadeIn>

              {/* FACILITY TAGS */}
              <FadeIn>
                <Field>
                  <Label>관련 시설 태그</Label>
                  <FacilityTagInput
                    tags={facilityTags}
                    onChange={setFacilityTags}
                  />
                </Field>
              </FadeIn>

              <FadeIn>
                <Divider soft className="my-5" />
              </FadeIn>

              {/* ANONYMOUS SWITCH */}
              <FadeIn>
                <SwitchField>
                  <Label>익명으로 게시</Label>
                  <Description>닉네임 대신 &quot;익명&quot;으로 표시됩니다</Description>
                  <Switch
                    color="dotori"
                    checked={anonymous}
                    onChange={setAnonymous}
                  />
                </SwitchField>
              </FadeIn>
            </Fieldset>
          </FadeInStagger>
        </div>
      </motion.div>

      {/* ══════ ERROR INLINE ALERT ══════ */}
      <InlineAlert
        variant="warning"
        title={error ?? ''}
        show={error !== null}
        onDismiss={() => setError(null)}
      />
    </div>
  )
}
