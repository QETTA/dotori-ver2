import { cn } from '@/lib/utils'
import { DS_ICON } from '@/lib/design-system/tokens'
import type { LucideIcon } from 'lucide-react'

type IconSize = keyof typeof DS_ICON

interface DotoriIconProps {
  icon: LucideIcon
  size?: IconSize
  className?: string
}

/**
 * DotoriIcon — lucide-react 아이콘에 DS_ICON 크기 토큰을 적용하는 래퍼
 *
 * @example
 * <DotoriIcon icon={MapPin} size="md" className="text-dotori-500" />
 */
export function DotoriIcon({ icon: Icon, size = 'md', className }: DotoriIconProps) {
  return <Icon className={cn(DS_ICON[size], className)} />
}
