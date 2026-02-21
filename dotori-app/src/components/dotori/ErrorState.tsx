import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

export function ErrorState({
	message,
	detail,
	action,
	variant = "default",
}: {
	message: string;
	detail?: string;
	action?: { label: string; onClick: () => void };
	variant?: "default" | "network" | "notfound";
}) {
	const illustrations: Record<string, string> = {
		default: BRAND.errorState,
		network: BRAND.errorState,
		notfound: BRAND.emptyState,
	};

	const defaultDetails: Record<string, string> = {
		network: "인터넷 연결을 확인해주세요",
		notfound: "요청하신 페이지를 찾을 수 없습니다",
	};

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center px-6 py-16 text-center",
				"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-300",
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={illustrations[variant]}
				alt=""
				aria-hidden="true"
				className="mb-5 h-36 w-36"
			/>
			<p className="text-lg font-semibold text-dotori-800">{message}</p>
			{(detail || defaultDetails[variant]) && (
				<p className="mt-2 max-w-xs text-[15px] leading-relaxed text-dotori-500">
					{detail || defaultDetails[variant]}
				</p>
			)}
			{action && (
				<button
					onClick={action.onClick}
					className="mt-5 rounded-3xl bg-dotori-400 px-7 py-4 text-[15px] font-bold text-white transition-all active:scale-[0.98] hover:bg-dotori-600"
				>
					{action.label}
				</button>
			)}
		</div>
	);
}
