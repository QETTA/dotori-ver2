import { Skeleton } from '@/components/dotori/Skeleton'

export default function FacilityDetailLoading() {
  return (
    <div aria-label="로딩 중" role="status">
      <Skeleton variant="facility-detail" />
    </div>
  )
}
