import { Skeleton } from '@/components/dotori/Skeleton'

export default function ExploreLoading() {
  return (
    <div aria-label="로딩 중" role="status" className="space-y-4">
      {/* Search bar placeholder */}
      <div className="h-11 animate-pulse rounded-xl bg-dotori-100/80 dark:bg-dotori-800/60" aria-hidden="true" />
      <Skeleton variant="facility-card" count={4} />
    </div>
  )
}
