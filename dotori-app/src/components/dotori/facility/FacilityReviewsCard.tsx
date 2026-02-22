import { memo } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import type { CommunityPost } from "@/types/dotori";

interface FacilityReviewsCardProps {
	posts: CommunityPost[];
	facilityId?: string;
	facilityName?: string;
}

export const FacilityReviewsCard = memo(function FacilityReviewsCard({
	posts,
	facilityId,
	facilityName,
}: FacilityReviewsCardProps) {
	const writeHref = facilityId
		? `/community/write?facilityId=${encodeURIComponent(facilityId)}&facilityName=${encodeURIComponent(facilityName || "")}`
		: "/community/write";

	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="font-semibold">이웃 후기</h3>
				{posts.length > 0 && (
					<Link
						href="/community"
						className="text-sm text-dotori-500 hover:text-dotori-600"
					>
						더보기
					</Link>
				)}
			</div>
			{posts.length > 0 ? (
				<div className="space-y-2">
					{posts.map((post, index) => (
						<div
							key={post.id}
							className="rounded-xl bg-dotori-50 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300"
							style={{
								animationDelay: `${index * 120}ms`,
								animationFillMode: "both",
							}}
						>
							<p className="text-sm leading-relaxed text-dotori-800">
								{post.content}
							</p>
							<div className="mt-2 flex items-center gap-2">
								<span className="text-sm font-medium text-dotori-500">
									{post.author.nickname}
								</span>
								<span
									className="text-xs text-dotori-500"
									suppressHydrationWarning
								>
									{formatRelativeTime(post.createdAt)}
								</span>
							</div>
						</div>
					))}
				</div>
			) : (
				<p className="py-4 text-center text-sm text-dotori-500">
					아직 후기가 없어요
				</p>
			)}

			{/* 후기 작성 버튼 */}
			<Link
				href={writeHref}
				className="mt-3 flex w-full items-center justify-center rounded-2xl border border-dotori-500 py-3 text-sm font-semibold text-dotori-500 transition-all active:scale-[0.97] hover:bg-dotori-50"
			>
				후기 작성하기
			</Link>
		</section>
	);
});
