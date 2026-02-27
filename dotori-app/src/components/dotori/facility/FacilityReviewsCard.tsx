import { memo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { formatRelativeTime } from "@/lib/utils";
import type { CommunityPost } from "@/types/dotori";

interface FacilityReviewsCardProps {
	posts: CommunityPost[];
	facilityId?: string;
	facilityName?: string;
}

const reviewListVariants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.12,
		},
	},
} as const;

const reviewItemVariants = {
	hidden: { opacity: 0, y: 10 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.3,
			ease: "easeOut",
		},
	},
} as const;

export const FacilityReviewsCard = memo(function FacilityReviewsCard({
	posts,
	facilityId,
	facilityName,
}: FacilityReviewsCardProps) {
	const writeHref = facilityId
		? `/community/write?facilityId=${encodeURIComponent(facilityId)}&facilityName=${encodeURIComponent(facilityName || "")}`
		: "/community/write";

	return (
		<section className={'glass-card rounded-2xl p-5 shadow-sm'}>
			<div className={'mb-3 flex items-center justify-between'}>
				<h3 className={'font-semibold'}>이웃 후기</h3>
				{posts.length > 0 && (
					<Link
						href="/community"
						className={'text-body text-dotori-500 hover:text-dotori-600'}
					>
						더보기
					</Link>
				)}
			</div>
			{posts.length > 0 ? (
				<motion.div
					className={'space-y-2'}
					variants={reviewListVariants}
					initial="hidden"
					animate="show"
				>
					{posts.map((post) => (
						<motion.div
							key={post.id}
							className={'rounded-xl bg-dotori-50 p-4'}
							variants={reviewItemVariants}
						>
							<p className={'text-body leading-relaxed text-dotori-800'}>
								{post.content}
							</p>
							<div className={'mt-2 flex items-center gap-2'}>
								<span className={'text-body font-medium text-dotori-500'}>
									{post.author.nickname}
								</span>
								<span
									className={'text-body-sm text-dotori-500'}
									suppressHydrationWarning
								>
									{formatRelativeTime(post.createdAt)}
								</span>
							</div>
						</motion.div>
					))}
				</motion.div>
			) : (
				<p className={'py-4 text-center text-body text-dotori-500'}>
					아직 후기가 없어요
				</p>
			)}

			{/* 후기 작성 버튼 */}
			<Link
				href={writeHref}
				className={'mt-3 flex w-full items-center justify-center rounded-2xl border border-dotori-500 py-3 text-body font-semibold text-dotori-500 transition-all active:scale-[0.97] hover:bg-dotori-50'}
			>
				후기 작성하기
			</Link>
		</section>
	);
});
