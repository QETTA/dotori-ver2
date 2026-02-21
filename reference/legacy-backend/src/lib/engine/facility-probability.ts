import prisma from '@/lib/db/prisma'
import {
  calculateProbability,
  calculateTrend,
  type ProbabilityFactors,
  type ProbabilityResult,
  type TrendResult,
} from './probability'

/**
 * Calculate probability for a specific facility + age group using live DB data.
 * Optionally pass user-specific overrides (queuePosition, priority, bonusPoints).
 */
export async function calculateFacilityProbability(
  facilityId: string,
  ageGroup: string,
  userOverrides?: Partial<Pick<ProbabilityFactors, 'queuePosition' | 'priority' | 'bonusPoints'>>,
): Promise<ProbabilityResult & { trend?: TrendResult }> {
  const [ageClass, toEvents, previousCache] = await Promise.all([
    prisma.ageClass.findUnique({
      where: { facilityId_ageGroup: { facilityId, ageGroup } },
    }),
    prisma.tOEvent.findMany({
      where: {
        facilityId,
        ageGroup,
        occurredAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.probabilityCache.findUnique({
      where: { facilityId_ageGroup: { facilityId, ageGroup } },
      select: { probability: true, calculatedAt: true },
    }),
  ])

  const capacity = ageClass?.capacity ?? 20
  const currentEnroll = ageClass?.currentCount ?? 0
  const totalWaiting = ageClass?.waitlistCount ?? 0

  // Historical TO rate: average monthly TOs over past year
  const totalTOs = toEvents.reduce((sum, e) => sum + e.slots, 0)
  const historicalTORate = totalTOs / 12

  const factors: ProbabilityFactors = {
    queuePosition: userOverrides?.queuePosition ?? Math.ceil(totalWaiting / 2),
    totalWaiting,
    classCapacity: capacity,
    currentEnroll,
    historicalTORate,
    priority: userOverrides?.priority ?? 1,
    bonusPoints: userOverrides?.bonusPoints ?? 0,
  }

  const result = calculateProbability(factors)

  // Calculate trend if previous cache exists
  let trend: TrendResult | undefined
  if (previousCache) {
    trend = calculateTrend(result.probability, previousCache.probability)
  }

  return { ...result, trend }
}
