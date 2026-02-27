/**
 * Zod validation schemas for API input parsing.
 * Centralized to ensure consistent validation across all routes.
 *
 * Note: Using Zod 4 API — `error`/`message` params, not `required_error`.
 */
import { createApiErrorResponse } from '@/lib/api-error'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// --- internal helpers ---

const objectIdPattern = '[a-f\\d]{24}'
const objectIdRegex = new RegExp(`^${objectIdPattern}$`, 'i')
const facilityIdRegex = new RegExp(`^(?:${objectIdPattern})(?:,(?:${objectIdPattern}))*$`, 'i')

// --- Shared primitives ---

export const objectIdSchema = z.string().regex(objectIdRegex, '유효하지 않은 ID 형식입니다')
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다')

export function isValidObjectId(id: string): boolean {
  return objectIdRegex.test(id)
}

// --- Chat ---

export const chatMessageSchema = z.object({
  message: z
    .string({ error: 'message는 필수입니다' })
    .min(1, 'message는 필수입니다')
    .max(2000, '메시지는 2000자 이내로 입력해주세요'),
  previousMessages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant'], {
          error: 'role 값이 유효하지 않습니다',
        }),
        content: z
          .string({ error: 'previousMessages content는 필수입니다' })
          .min(1, 'previousMessages content는 필수입니다'),
      }),
    )
    .max(10, '이전 메시지는 최대 10개까지 전송할 수 있어요')
    .optional(),
})

// --- Actions ---

/** facilityId: 단일 ObjectId 또는 쉼표 구분 다중 ObjectId (generate_report용) */
const facilityIdSchema = z.string().regex(facilityIdRegex, '유효하지 않은 시설 ID 형식입니다')

export const actionIntentSchema = z.object({
  actionType: z.enum(
    ['register_interest', 'apply_waiting', 'set_alert', 'generate_report', 'generate_checklist'],
    { error: '유효하지 않은 액션 타입입니다' },
  ),
  params: z.object({
    facilityId: facilityIdSchema,
    childName: z.string().max(50).optional(),
    childBirthDate: dateStringSchema.optional(),
  }),
})

export const actionExecuteSchema = z.object({
  intentId: objectIdSchema,
})

// --- Waitlist ---

export const waitlistCreateSchema = z.object({
  facilityId: objectIdSchema,
  childName: z
    .string({ error: '아이 이름은 필수입니다' })
    .min(1, '아이 이름은 필수입니다')
    .max(50, '아이 이름은 50자 이내여야 합니다'),
  childBirthDate: dateStringSchema,
})

export const waitlistUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  checklist: z
    .array(
      z.object({
        docName: z.string(),
        checked: z.boolean(),
      }),
    )
    .optional(),
})

// --- Community ---

export const commentCreateSchema = z.object({
  content: z
    .string({ error: '댓글 내용은 필수입니다' })
    .min(1, '댓글 내용은 필수입니다')
    .transform((v) => v.slice(0, 2000)),
})

export const communityPostCreateSchema = z.object({
  content: z
    .string({ error: '내용을 입력해주세요' })
    .min(1, '내용을 입력해주세요')
    .max(5000, '내용은 5000자 이내여야 합니다'),
  category: z.enum(['question', 'review', 'info', 'feedback'], {
    error: '유효하지 않은 카테고리입니다',
  }),
  facilityTags: z.array(z.string()).max(5).optional(),
})

// --- Facility type / category ---

export const facilityTypeSchema = z.enum([
  '국공립', '민간', '가정', '직장', '협동', '사회복지',
  '국립유치원', '공립유치원', '사립유치원',
])

export const facilityCategorySchema = z.enum(['daycare', 'kindergarten'])

// --- E-Signature ---

export const eSignatureCreateSchema = z.object({
  facilityId: objectIdSchema,
  documentType: z.enum([
    // 기존 서류 (enrollment)
    '입소신청서',
    '건강검진확인서',
    '예방접종증명서',
    '영유아건강검진결과통보서',
    '주민등록등본',
    '재직증명서',
    '소득증빙서류',
    // 동의서 (consent) — 전략 v4.0
    '입소동의서',
    '개인정보동의서',
    '귀가동의서',
    '투약의뢰서',
    '현장학습동의서',
    '차량운행동의서',
    'CCTV열람동의서',
  ], { error: '유효하지 않은 서류 유형입니다' }),
  title: z
    .string({ error: '서류 제목은 필수입니다' })
    .min(1, '서류 제목은 필수입니다')
    .max(200, '서류 제목은 200자 이내여야 합니다'),
})

export const eSignatureStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'pending', 'signed', 'submitted', 'expired'], {
    error: '유효하지 않은 서류 상태입니다',
  }),
})

/** 상태전이 유효성 검증 스키마 (from → to) */
export const eSignatureTransitionSchema = z.object({
  from: z.enum(['draft', 'pending', 'signed', 'submitted', 'expired'], {
    error: '유효하지 않은 현재 상태입니다',
  }),
  to: z.enum(['draft', 'pending', 'signed', 'submitted', 'expired'], {
    error: '유효하지 않은 대상 상태입니다',
  }),
})

// --- Alerts ---

export const alertCreateSchema = z.object({
  facilityId: objectIdSchema,
  type: z.enum(
    [
      'vacancy',
      'waitlist_change',
      'review',
      'transfer_vacancy',
      'class_assignment',
      'teacher_change',
    ],
    {
      error: '유효하지 않은 알림 타입입니다',
    },
  ),
  condition: z.record(z.string(), z.unknown()).optional(),
  channels: z
    .array(z.enum(['push', 'kakao', 'email']))
    .min(1, '최소 1개 채널을 선택해주세요')
    .optional(),
})

// --- User profile update ---

const childSchema = z.object({
  name: z.string().min(1, '아이 이름은 필수입니다').max(50),
  birthDate: dateStringSchema,
  gender: z.enum(['male', 'female', 'unspecified']).default('unspecified'),
  specialNeeds: z.array(z.string().max(100)).max(20).optional(),
})

const regionSchema = z.object({
  sido: z.string().max(50).default(''),
  sigungu: z.string().max(50).default(''),
  dong: z.string().max(50).default(''),
})

const preferencesSchema = z.object({
  facilityTypes: z.array(z.string().max(50)).max(20).default([]),
  features: z.array(z.string().max(100)).max(50).default([]),
})

const notificationSettingsSchema = z.object({
  vacancy: z.boolean(),
  document: z.boolean(),
  community: z.boolean(),
  marketing: z.boolean(),
})

export const userUpdateSchema = z
  .object({
    nickname: z.string().max(50).optional(),
    phone: z.string().max(20).optional(),
    children: z.array(childSchema).max(10).optional(),
    region: regionSchema.optional(),
    preferences: preferencesSchema.optional(),
    notificationSettings: notificationSettingsSchema.optional(),
    gpsVerified: z.boolean().optional(),
    onboardingCompleted: z.boolean().optional(),
    alimtalkOptIn: z.boolean().optional(),
  })
  .strict()

// --- User interests ---

export const interestSchema = z.object({
  facilityId: objectIdSchema,
})

// --- Visit ---

export const visitCreateSchema = z.object({
  facilityId: objectIdSchema,
  scheduledAt: z
    .string({ error: '견학 날짜는 필수입니다' })
    .min(1, '견학 날짜는 필수입니다'),
  childId: objectIdSchema.optional(),
  notes: z.string().max(500, '메모는 500자 이내여야 합니다').optional(),
})

export const visitUpdateSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled'], {
    error: '유효하지 않은 견학 상태입니다',
  }),
  cancelReason: z.string().max(200).optional(),
})

// --- Review ---

export const reviewCreateSchema = z.object({
  rating: z.number({ error: '평점은 필수입니다' }).int().min(1, '평점은 1~5 사이여야 합니다').max(5, '평점은 1~5 사이여야 합니다'),
  content: z
    .string({ error: '리뷰 내용은 필수입니다' })
    .min(1, '리뷰 내용은 필수입니다')
    .max(2000, '리뷰는 2000자 이내여야 합니다'),
  images: z.array(z.string().url()).max(5, '이미지는 최대 5개까지 첨부할 수 있습니다').optional(),
})

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().min(1).max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
})

// --- Signature ---

export const signatureSubmitSchema = z.object({
  signatureData: z
    .string({ error: '서명 데이터는 필수입니다' })
    .min(1, '서명 데이터는 필수입니다'),
})

// --- Helper: safe parse + 400 response ---

export function parseBody<T>(
  schema: z.ZodType<T>,
  data: unknown,
  requestId?: string,
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }

  const firstError = result.error.issues[0]
  return {
    success: false,
    response: createApiErrorResponse({
      status: 400,
      code: 'BAD_REQUEST',
      message: firstError?.message || '입력값이 올바르지 않습니다',
      details: firstError
        ? {
            fields: [
              {
                path: firstError.path.join('.'),
                reason: firstError.code,
              },
            ],
          }
        : null,
      requestId,
    }),
  }
}
