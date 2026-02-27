import { Skeleton } from '@/components/dotori/Skeleton'

export default function CommunityLoading() {
  return (
    <div aria-label="로딩 중" role="status">
      <Skeleton variant="community-post" count={3} />
    </div>
  )
}
