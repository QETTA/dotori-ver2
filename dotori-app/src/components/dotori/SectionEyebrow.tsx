import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'

interface SectionEyebrowProps {
  children: React.ReactNode
  className?: string
}

/**
 * SectionEyebrow — 섹션 아이브로 텍스트
 * font-mono, uppercase, tracking-widest, dotori-500
 */
export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  return (
    <p className={cn(DS_PAGE_HEADER.eyebrow, className)}>{children}</p>
  )
}
