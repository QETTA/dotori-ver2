import { Skeleton } from '@/components/dotori/Skeleton'

export default function ChatLoading() {
  return (
    <div aria-label="로딩 중" role="status" className="flex h-[70vh] flex-col justify-between">
      <div className="space-y-4 pt-4">
        <Skeleton variant="chat" />
        <Skeleton variant="chat" />
      </div>
      {/* Input bar placeholder */}
      <div className="h-12 animate-pulse rounded-xl bg-dotori-100/80 dark:bg-dotori-800/60" aria-hidden="true" />
    </div>
  )
}
