import { z } from 'zod'

/* ═══════════════════════════════════════
 *  Shared Validators
 * ═══════════════════════════════════════ */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const idSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

/* ═══════════════════════════════════════
 *  Facility Schemas
 * ═══════════════════════════════════════ */

export const facilityFilterSchema = paginationSchema.extend({
  type: z.enum(['국공립', '민간', '가정', '직장', '사회복지', '법인']).optional(),
  ageGroup: z.enum(['0세반', '1세반', '2세반', '3세반', '4세반', '5세반']).optional(),
  sort: z.enum(['probability', 'distance', 'rating', 'cost']).default('probability'),
  q: z.string().max(100).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
})

/* ═══════════════════════════════════════
 *  Search Schemas
 * ═══════════════════════════════════════ */

export const searchSchema = z.object({
  q: z.string().min(1, '검색어를 입력해주세요.').max(100),
  limit: z.coerce.number().int().min(1).max(50).default(8),
})

/* ═══════════════════════════════════════
 *  Alert Schemas
 * ═══════════════════════════════════════ */

export const alertFilterSchema = paginationSchema.extend({
  type: z.enum(['to', 'probability', 'system', 'consult', 'promotion']).optional(),
})

export const markAlertReadSchema = z.object({
  alertId: z.string().min(1).optional(),
  markAllRead: z.boolean().optional(),
})

/* ═══════════════════════════════════════
 *  Simulation Schemas
 * ═══════════════════════════════════════ */

export const simulationSchema = z.object({
  facilityId: z.string().min(1),
  strategies: z
    .array(
      z.enum([
        'second_choice',
        'dual_income',
        'extended_care',
        'sibling',
        'multi_child',
        'nearby',
        'off_peak',
        'priority_area',
      ]),
    )
    .min(1)
    .max(8),
  childAge: z.coerce.number().int().min(0).max(6).optional(),
  targetGroup: z.enum(['0세반', '1세반', '2세반', '3세반', '4세반', '5세반']).optional(),
})

/* ═══════════════════════════════════════
 *  Chat Schemas
 * ═══════════════════════════════════════ */

export const chatMessageSchema = z.object({
  message: z.string().min(1, '메시지를 입력해주세요.').max(2000),
  facilityId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'ai', 'assistant', 'system']),
        content: z.string().min(1).max(2000),
      }),
    )
    .max(20)
    .optional(),
})

/* ═══════════════════════════════════════
 *  Consult Schemas
 * ═══════════════════════════════════════ */

export const createConsultSchema = z.object({
  type: z.enum(['ai', 'expert']),
  facilityIds: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
})

/* ═══════════════════════════════════════
 *  Favorite Schemas
 * ═══════════════════════════════════════ */

export const toggleFavoriteSchema = z.object({
  facilityId: z.string().min(1),
})

/* ═══════════════════════════════════════
 *  Payment Schemas
 * ═══════════════════════════════════════ */

export const paymentConfirmSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().regex(/^dotori_(basic|pro)_(monthly|annual)_\d+_\w+$/),
  amount: z.coerce.number().int().positive(),
})

export const paymentCancelSchema = z.object({
  paymentKey: z.string().min(1),
  cancelReason: z.string().min(1).max(200),
})

/* ═══════════════════════════════════════
 *  User Profile Schemas
 * ═══════════════════════════════════════ */

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  notifyPush: z.boolean().optional(),
  notifyKakao: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
})

/* ═══════════════════════════════════════
 *  API Response Schemas (Contract)
 * ═══════════════════════════════════════ */

export const facilityResponseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  address: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  capacity: z.number().int().optional(),
  currentEnroll: z.number().int().optional(),
  phone: z.string().nullable().optional(),
  operatingHours: z.string().nullable().optional(),
  probability: z.number().nullable().optional(),
  grade: z.string().nullable().optional(),
  factors: z.unknown().nullable().optional(),
  ageGroups: z.array(z.unknown()).optional(),
  isFavorited: z.boolean(),
  distanceMeters: z.number().nullable().optional(),
})

export const facilityListResponseSchema = z.array(facilityResponseItemSchema)

export const alertResponseItemSchema = z.object({
  id: z.string(),
  type: z.enum(['to', 'probability', 'system', 'consult', 'promotion']),
  title: z.string(),
  body: z.string(),
  facilityName: z.string().nullable().optional(),
  isRead: z.boolean(),
  createdAt: z.string().min(1),
})

export const alertListResponseSchema = z.array(alertResponseItemSchema)

export const alertMarkReadResponseSchema = z.object({
  marked: z.string().nullable(),
  mock: z.boolean().optional(),
})

export const searchFacilityResultSchema = z.object({
  type: z.literal('facility'),
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  href: z.string(),
  grade: z.string().optional().nullable(),
  probability: z.number().optional().nullable(),
})

export const searchAlertResultSchema = z.object({
  type: z.literal('alert'),
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  href: z.string(),
})

export const searchResultSchema = z.union([searchFacilityResultSchema, searchAlertResultSchema])
export const searchResultListSchema = z.array(searchResultSchema)

export const simulationResponseSchema = z.object({
  baseProbability: z.number(),
  adjustedProbability: z.number(),
  delta: z.number(),
  grade: z.object({
    before: z.string(),
    after: z.string(),
  }),
  strategies: z.array(
    z.object({
      id: z.string(),
      impact: z.number(),
    }),
  ),
})

export const favoriteResponseItemSchema = z.object({
  id: z.string(),
  facilityId: z.string(),
  facility: z.object({
    name: z.string(),
    type: z.string(),
    probability: z.number().nullable().optional(),
    grade: z.string().nullable().optional(),
  }),
  createdAt: z.string().min(1),
})

export const favoriteListResponseSchema = z.array(favoriteResponseItemSchema)

export const favoriteToggleResponseSchema = z.object({
  action: z.enum(['added', 'removed']),
  facilityId: z.string(),
  mock: z.boolean().optional(),
})

export const userProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().email(),
  provider: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  isOnboarded: z.boolean(),
  children: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      birthDate: z.union([z.string(), z.date()]).nullable().optional(),
    }),
  ),
  createdAt: z.string().min(1),
})

export const userProfileUpdateResponseSchema = z.object({
  updated: z.boolean(),
  mock: z.boolean().optional(),
})

export const consultResponseItemSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    summary: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough()

export const consultListResponseSchema = z.array(consultResponseItemSchema)

export const consultCreateResponseSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    status: z.string(),
    summary: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    mock: z.boolean().optional(),
  })
  .passthrough()

/* ═══════════════════════════════════════
 *  Helper: Parse with nice errors
 * ═══════════════════════════════════════ */

export function parseSearchParams<T extends z.ZodType>(schema: T, searchParams: URLSearchParams): z.infer<T> {
  const obj: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    obj[key] = value
  })
  return schema.parse(obj)
}

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  return schema.parse(body)
}
