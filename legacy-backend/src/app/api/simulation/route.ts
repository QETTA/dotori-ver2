import { apiHandler, ok } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { getGrade } from '@/lib/utils'
import { simulationResponseSchema, simulationSchema } from '@/lib/validations'

const STRATEGY_IMPACTS: Record<string, number> = {
  second_choice: 12,
  dual_income: 7,
  extended_care: 5,
  sibling: 15,
  multi_child: 10,
  nearby: 8,
  off_peak: 6,
  priority_area: 9,
}

export const POST = apiHandler({
  auth: true,
  input: simulationSchema,
  handler: async ({ input }) => {
    try {
      const prob = await prisma.probabilityCache.findFirst({
        where: { facilityId: input.facilityId },
        orderBy: { calculatedAt: 'desc' },
      })
      const base = prob?.probability ?? 50
      const delta = input.strategies.reduce((sum, s) => sum + (STRATEGY_IMPACTS[s] ?? 0), 0)
      const adjusted = Math.min(100, base + delta)
      const responseData = simulationResponseSchema.parse({
        baseProbability: base,
        adjustedProbability: adjusted,
        delta,
        grade: { before: getGrade(base), after: getGrade(adjusted) },
        strategies: input.strategies.map((s) => ({ id: s, impact: STRATEGY_IMPACTS[s] ?? 0 })),
      })
      return ok(responseData)
    } catch {
      const base = 50
      const delta = input.strategies.reduce((sum, s) => sum + (STRATEGY_IMPACTS[s] ?? 0), 0)
      const responseData = simulationResponseSchema.parse({
        baseProbability: base,
        adjustedProbability: Math.min(100, base + delta),
        delta,
        grade: { before: 'C', after: 'B' },
        strategies: input.strategies.map((s) => ({ id: s, impact: STRATEGY_IMPACTS[s] ?? 0 })),
      })
      return ok(responseData)
    }
  },
})
