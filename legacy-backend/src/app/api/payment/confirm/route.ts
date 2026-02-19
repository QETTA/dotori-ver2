import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { confirmPayment, PLAN_PRICES } from '@/lib/payment'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { paymentConfirmSchema } from '@/lib/validations'

export const GET = apiHandler({
  auth: true,
  input: paymentConfirmSchema,
  handler: async ({ input, user, request }) => {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'anonymous'
    const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.heavy)
    if (!rateCheck.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
      return Response.json(
        { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      ) as any
    }

    const { paymentKey, orderId, amount } = input
    const parts = orderId.split('_')
    const plan = parts[1] as 'basic' | 'pro'
    const cycle = parts[2] as 'monthly' | 'annual'
    const expectedPrice = PLAN_PRICES[plan]?.[cycle]
    if (expectedPrice !== amount) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'AMOUNT_MISMATCH', message: '결제 금액 불일치' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ) as any
    }
    try {
      await confirmPayment(paymentKey, orderId, amount)
      try {
        await prisma.payment.create({
          data: {
            userId: user!.id,
            orderId,
            paymentKey,
            amount,
            plan,
            method: 'toss',
            status: 'completed',
            paidAt: new Date(),
          },
        })
        await prisma.user.update({ where: { id: user!.id }, data: { plan } })
      } catch {}
      return ok({ status: 'success', plan, cycle, orderId })
    } catch (e: any) {
      return ok({ status: 'failed', message: e.message })
    }
  },
})
