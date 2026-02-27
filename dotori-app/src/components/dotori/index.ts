/**
 * Dotori 컴포넌트 — 단일 진입점 (barrel file)
 *
 * @example
 * import { FacilityCard, SourceChip } from "@/components/dotori";
 */

export { ActionConfirmSheet } from "./ActionConfirmSheet";
export { BottomTabBar } from "./BottomTabBar";
export { BrandEmptyIllustration } from "./BrandEmptyIllustration";
export { BrandWatermark } from "./BrandWatermark";
export { ChatBubble } from "./ChatBubble";
export { CompareTable } from "./CompareTable";
export { EmptyState } from "./EmptyState";
export { ErrorState } from "./ErrorState";
export { FacilityCard } from "./FacilityCard";
export { KakaoChannelButton } from "./KakaoChannelButton";
export { MapEmbed } from "./MapEmbed";
export { MarkdownText } from "./MarkdownText";
export { PageHeader } from "./PageHeader";
export { PageTransition } from "./PageTransition";
export { SeasonalBriefing } from "./SeasonalBriefing";
export { SectionEyebrow } from "./SectionEyebrow";
export { ShareButton } from "./ShareButton";
export { Skeleton } from "./Skeleton";
export { SourceChip } from "./SourceChip";
export { StreamingIndicator } from "./StreamingIndicator";
export { Toast } from "./Toast";
export { ToastProvider } from "./ToastProvider";

// R49 신규 컴포넌트
export { ActionCard } from "./ActionCard";
export { BundleSignCTA } from "./BundleSignCTA";
export { FacilityTagInput } from "./FacilityTagInput";
export { FacilityTagLink } from "./FacilityTagLink";
export { FunnelProgressWidget } from "./FunnelProgressWidget";
export { SocialProofBadge } from "./SocialProofBadge";
export { StickyBottomCTA } from "./StickyBottomCTA";
export { ToBadge } from "./ToBadge";
export { ToRiFAB } from "./ToRiFAB";
export { TrendingRegionChips } from "./TrendingRegionChips";

// 서브디렉토리 재export
export * from "./facility";
