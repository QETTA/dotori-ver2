"use client";

import {
	ArrowLeftIcon,
	HeartIcon as HeartOutline,
	ShareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useToast } from "@/components/dotori/ToastProvider";

interface FacilityDetailHeaderProps {
	name: string;
	facilityId: string;
	facilityType: string;
	liked: boolean;
	isTogglingLike: boolean;
	onToggleLike: () => void;
}

export function FacilityDetailHeader({
	name,
	facilityId,
	facilityType,
	liked,
	isTogglingLike,
	onToggleLike,
}: FacilityDetailHeaderProps) {
	const { addToast } = useToast();

	async function handleShare() {
		const url = `${window.location.origin}/facility/${facilityId}`;
		const shareData = {
			title: name,
			text: `${name} - ${facilityType} | 도토리`,
			url,
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
			} else {
				await navigator.clipboard.writeText(url);
				addToast({ type: "success", message: "링크가 복사되었어요" });
			}
		} catch {
			// User cancelled share or clipboard failed — ignore
		}
	}

	return (
		<header className="sticky top-0 z-20 flex items-center justify-between bg-white/80 px-5 py-3.5 backdrop-blur-xl">
			<Link
				href="/explore"
				aria-label="뒤로 가기"
				className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
			>
				<ArrowLeftIcon className="h-6 w-6" />
			</Link>
			<h1 className="text-[17px] font-semibold">{name}</h1>
			<div className="flex items-center gap-1">
				<button
					onClick={onToggleLike}
					disabled={isTogglingLike}
					aria-label="관심 시설 추가/제거"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					{liked ? (
						<HeartSolid className="h-6 w-6 text-red-500 motion-safe:animate-in motion-safe:zoom-in duration-200" />
					) : (
						<HeartOutline className="h-6 w-6 text-dotori-500" />
					)}
				</button>
				<button
					onClick={handleShare}
					aria-label="공유"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ShareIcon className="h-6 w-6 text-dotori-500" />
				</button>
			</div>
		</header>
	);
}
