import { Skeleton } from '@/components/dotori/Skeleton'

export default function AppLoading() {
  return (
    <div aria-label="로딩 중" role="status">
      <Skeleton variant="home" />
    </div>
  )
}
