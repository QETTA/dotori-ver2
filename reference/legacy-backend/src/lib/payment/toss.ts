import { randomUUID } from 'node:crypto'

/**
 * 토스페이먼츠 서버 SDK 래퍼
 * https://docs.tosspayments.com/reference
 *
 * 환경변수:
 *  - TOSS_SECRET_KEY: 시크릿 키
 *  - NEXT_PUBLIC_TOSS_CLIENT_KEY: 클라이언트 키
 */

const TOSS_API = 'https://api.tosspayments.com/v1'

function getAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) throw new Error('TOSS_SECRET_KEY is not set')
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
}

async function tossRequest<T>(path: string, options: { method?: string; body?: Record<string, any> } = {}): Promise<T> {
  const { method = 'GET', body } = options

  const res = await fetch(`${TOSS_API}${path}`, {
    method,
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new TossPaymentError(data.code ?? 'UNKNOWN', data.message ?? '결제 처리 중 오류가 발생했습니다.', res.status)
  }

  return data as T
}

/* ─── Error ─── */
export class TossPaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
  ) {
    super(message)
    this.name = 'TossPaymentError'
  }
}

/* ─── Types ─── */
export interface TossPayment {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt: string
  receipt?: { url: string }
  card?: { number: string; company: string; installmentPlanMonths: number }
  easyPay?: { provider: string }
}

export interface TossCancel {
  cancelAmount: number
  cancelReason: string
  canceledAt: string
  transactionKey: string
}

/* ─── Plan Prices ─── */
export const PLAN_PRICES = {
  basic: { monthly: 9900, annual: 7920 },
  pro: { monthly: 19900, annual: 15920 },
} as const

export type PlanKey = keyof typeof PLAN_PRICES
export type BillingCycle = 'monthly' | 'annual'

export function getPlanPrice(plan: PlanKey, cycle: BillingCycle): number {
  return PLAN_PRICES[plan][cycle]
}

export function generateOrderId(plan: PlanKey, cycle: BillingCycle): string {
  const uuid = randomUUID().replace(/-/g, '').slice(0, 12)
  return `dotori_${plan}_${cycle}_${Date.now()}_${uuid}`
}

/* ─── API Methods ─── */

/** 결제 승인 */
export async function confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<TossPayment> {
  return tossRequest<TossPayment>('/payments/confirm', {
    method: 'POST',
    body: { paymentKey, orderId, amount },
  })
}

/** 결제 조회 */
export async function getPayment(paymentKey: string): Promise<TossPayment> {
  return tossRequest<TossPayment>(`/payments/${paymentKey}`)
}

/** 결제 취소 */
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number,
): Promise<TossPayment> {
  return tossRequest<TossPayment>(`/payments/${paymentKey}/cancel`, {
    method: 'POST',
    body: { cancelReason, ...(cancelAmount && { cancelAmount }) },
  })
}

/** 주문번호로 조회 */
export async function getPaymentByOrderId(orderId: string): Promise<TossPayment> {
  return tossRequest<TossPayment>(`/payments/orders/${orderId}`)
}

/* ─── Client-side helpers ─── */

/** 토스 결제 위젯 초기화용 클라이언트 키 */
export function getClientKey(): string {
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ''
}

/** 결제 요청 파라미터 생성 (클라이언트에서 사용) */
export function createPaymentRequest(plan: PlanKey, cycle: BillingCycle, userName: string) {
  const amount = getPlanPrice(plan, cycle)
  const orderId = generateOrderId(plan, cycle)
  const planLabel = plan === 'basic' ? '베이직' : '프로'
  const cycleLabel = cycle === 'monthly' ? '월간' : '연간'

  return {
    amount,
    orderId,
    orderName: `도토리 ${planLabel} 플랜 (${cycleLabel})`,
    customerName: userName,
    successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/payment/confirm`,
    failUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/consult/payment?status=fail`,
  }
}
