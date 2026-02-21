import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

/**
 * Server-side React Query prefetch
 * Creates a QueryClient per request (via React cache), prefetches data,
 * then passes dehydrated state to HydrationBoundary for client hydration.
 *
 * Usage in RSC page:
 *   const queryClient = getQueryClient()
 *   await queryClient.prefetchQuery({ queryKey: ['facilities'], queryFn: ... })
 *   return <Hydrate state={dehydrate(queryClient)}><ClientComponent /></Hydrate>
 */

// One QueryClient per request (React cache deduplicates)
export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 min
          gcTime: 5 * 60 * 1000, // 5 min
          refetchOnWindowFocus: false,
        },
      },
    }),
)

/**
 * Re-export HydrationBoundary for convenience
 * Used in RSC layouts/pages to pass prefetched data to client components
 */
export { dehydrate, HydrationBoundary }

/**
 * Prefetch facilities list for explore page
 */
export async function prefetchFacilities(
  queryClient: QueryClient,
  params?: {
    type?: string
    sort?: string
    page?: number
  },
) {
  const { getFacilities } = await import('@/lib/data')
  await queryClient.prefetchQuery({
    queryKey: ['facilities', params?.type ?? '', params?.sort ?? 'probability', params?.page ?? 1],
    queryFn: () => getFacilities(params),
  })
}

/**
 * Prefetch single facility
 */
export async function prefetchFacility(queryClient: QueryClient, id: string) {
  const { getFacility } = await import('@/lib/data')
  await queryClient.prefetchQuery({
    queryKey: ['facility', id],
    queryFn: () => getFacility(id),
  })
}

/**
 * Prefetch alerts for user
 */
export async function prefetchAlerts(queryClient: QueryClient, userId: string) {
  const { getAlerts } = await import('@/lib/data')
  await queryClient.prefetchQuery({
    queryKey: ['alerts', userId],
    queryFn: () => getAlerts(userId),
  })
}

/**
 * Prefetch favorites
 */
export async function prefetchFavorites(queryClient: QueryClient, userId: string) {
  const { getFavorites } = await import('@/lib/data')
  await queryClient.prefetchQuery({
    queryKey: ['favorites', userId],
    queryFn: () => getFavorites(userId),
  })
}
