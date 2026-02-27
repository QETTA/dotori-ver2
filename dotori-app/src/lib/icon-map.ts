/**
 * Dotori Icon Map — lucide-react 아이콘 중앙 매핑
 *
 * 모든 아이콘 참조는 이 파일을 통해 일관성 있게 관리합니다.
 * heroicons → lucide 마이그레이션의 SSoT입니다.
 */

import {
  Baby,
  GraduationCap,
  School,
  CircleCheck,
  Clock,
  CircleX,
  Heart,
  MapPin,
  Phone,
  FileSignature,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  User,
  Bell,
  Settings,
  HelpCircle,
  Home,
  TrendingUp,
  Star,
  MessageSquare,
  Send,
  Sparkles,
  Globe,
  Clipboard,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  RotateCcw,
  Users,
  Filter,
  X,
  type LucideIcon,
} from 'lucide-react'

/** 시설유형 아이콘 */
export const FACILITY_ICONS = {
  daycare: Baby,
  kindergarten: GraduationCap,
  integrated: School,
} as const satisfies Record<string, LucideIcon>

/** 상태 아이콘 */
export const STATUS_ICONS = {
  available: CircleCheck,
  waiting: Clock,
  full: CircleX,
} as const satisfies Record<string, LucideIcon>

/** 액션 아이콘 */
export const ACTION_ICONS = {
  favorite: Heart,
  location: MapPin,
  call: Phone,
  sign: FileSignature,
} as const satisfies Record<string, LucideIcon>

/** 탐색 아이콘 */
export const EXPLORE_ICONS = {
  search: Search,
  filter: SlidersHorizontal,
  sort: ArrowUpDown,
  filterAlt: Filter,
  close: X,
} as const satisfies Record<string, LucideIcon>

/** 프로필 아이콘 */
export const PROFILE_ICONS = {
  user: User,
  bell: Bell,
  settings: Settings,
  help: HelpCircle,
} as const satisfies Record<string, LucideIcon>

/** 홈 아이콘 */
export const HOME_ICONS = {
  home: Home,
  trending: TrendingUp,
  star: Star,
  heart: Heart,
} as const satisfies Record<string, LucideIcon>

/** 채팅 아이콘 */
export const CHAT_ICONS = {
  message: MessageSquare,
  send: Send,
  sparkles: Sparkles,
} as const satisfies Record<string, LucideIcon>

/** 시설 상세 아이콘 */
export const FACILITY_DETAIL_ICONS = {
  phone: Phone,
  globe: Globe,
  mapPin: MapPin,
  heart: Heart,
  clipboard: Clipboard,
  chevronDown: ChevronDown,
  refresh: RefreshCw,
  checkCircle: CheckCircle,
  star: Star,
  users: Users,
  baby: Baby,
} as const satisfies Record<string, LucideIcon>

/** 토스트/피드백 아이콘 */
export const FEEDBACK_ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  undo: RotateCcw,
} as const satisfies Record<string, LucideIcon>
