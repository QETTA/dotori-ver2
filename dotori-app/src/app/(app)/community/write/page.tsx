"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useToast } from "@/components/dotori/ToastProvider";

const categories = [
	{ key: "question", label: "질문" },
	{ key: "review", label: "후기" },
	{ key: "info", label: "정보" },
];

function CommunityWriteForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { addToast } = useToast();

	const presetFacilityId = searchParams.get("facilityId") || "";
	const presetFacilityName = searchParams.get("facilityName") || "";

	const [content, setContent] = useState("");
	const [category, setCategory] = useState(
		presetFacilityId ? "review" : "question",
	);
	const [tagInput, setTagInput] = useState("");
	const [facilityTags, setFacilityTags] = useState<string[]>([]);
	const [facilityId, setFacilityId] = useState(presetFacilityId);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Pre-populate facility tag from URL params
	useEffect(() => {
		if (presetFacilityName && !facilityTags.includes(presetFacilityName)) {
			setFacilityTags((prev) =>
				prev.includes(presetFacilityName)
					? prev
					: [...prev, presetFacilityName],
			);
		}
	}, [presetFacilityName]); // eslint-disable-line react-hooks/exhaustive-deps

	function addTag() {
		const tag = tagInput.trim();
		if (tag && !facilityTags.includes(tag) && facilityTags.length < 5) {
			setFacilityTags((prev) => [...prev, tag]);
			setTagInput("");
		}
	}

	function removeTag(tag: string) {
		setFacilityTags((prev) => prev.filter((t) => t !== tag));
		// If removing the pre-set facility tag, also clear the facilityId
		if (tag === presetFacilityName) {
			setFacilityId("");
		}
	}

	async function handleSubmit() {
		if (!content.trim() || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const res = await apiFetch<{ data: { id: string } }>("/api/community/posts", {
				method: "POST",
				body: JSON.stringify({
					content: content.trim(),
					category,
					facilityTags: facilityTags.length > 0 ? facilityTags : undefined,
					...(facilityId ? { facilityId } : {}),
				}),
			});

			addToast({ type: "success", message: "글이 등록되었어요" });

			// Navigate to the new post detail page
			if (res.data?.id) {
				router.push(`/community/${res.data.id}`);
			} else if (facilityId) {
				router.push(`/facility/${facilityId}`);
			} else {
				router.push("/community");
			}
		} catch {
			addToast({
				type: "error",
				message: "글 등록에 실패했어요. 다시 시도해주세요",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="sticky top-0 z-20 flex items-center justify-between bg-white/95 px-4 py-3 backdrop-blur-sm">
				<button
					onClick={() => router.back()}
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</button>
				<h1 className="text-base font-bold">글쓰기</h1>
				<button
					onClick={handleSubmit}
					disabled={!content.trim() || isSubmitting}
					className={cn(
						"rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all active:scale-[0.97]",
						content.trim() && !isSubmitting
							? "bg-dotori-900 text-white"
							: "bg-dotori-100 text-dotori-400",
					)}
				>
					{isSubmitting ? "등록 중..." : "등록"}
				</button>
			</header>

			{/* 시설 연동 배지 */}
			{presetFacilityName && (
				<div className="px-5 pt-3">
					<span className="inline-flex items-center gap-1 rounded-full bg-dotori-100 px-3 py-1.5 text-[13px] font-medium text-dotori-700">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							className="h-3.5 w-3.5"
						>
							<path
								fillRule="evenodd"
								d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.307 11.307 0 00.757.433c.113.058.2.1.257.128l.024.012.007.004.003.001zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
								clipRule="evenodd"
							/>
						</svg>
						{presetFacilityName}
					</span>
				</div>
			)}

			{/* 카테고리 선택 */}
			<div className="flex gap-2 px-5 pt-4">
				{categories.map((cat) => (
					<button
						key={cat.key}
						onClick={() => setCategory(cat.key)}
						className={cn(
							"rounded-full px-4 py-2.5 text-[14px] font-medium transition-all active:scale-[0.97]",
							category === cat.key
								? "bg-dotori-900 text-white"
								: "bg-dotori-100 text-dotori-600",
						)}
					>
						{cat.label}
					</button>
				))}
			</div>

			{/* 본문 입력 */}
			<div className="mt-4 px-5">
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder={
						presetFacilityName
							? `${presetFacilityName}에 대한 후기를 남겨주세요`
							: "이웃에게 공유하고 싶은 내용을 작성해주세요"
					}
					rows={10}
					maxLength={5000}
					className="w-full resize-none rounded-2xl bg-dotori-50 p-4 text-[15px] leading-relaxed outline-none transition-all placeholder:text-dotori-400 focus:ring-2 focus:ring-dotori-300"
				/>
				<div className="mt-1 text-right text-[12px] text-dotori-400">
					{content.length}/5000
				</div>
			</div>

			{/* 시설 태그 */}
			<div className="mt-4 px-5">
				<h3 className="mb-2 text-[14px] font-medium text-dotori-600">
					관련 시설 태그 (선택)
				</h3>
				<div className="flex gap-2">
					<input
						value={tagInput}
						onChange={(e) => setTagInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addTag();
							}
						}}
						placeholder="시설 이름 입력"
						className="min-w-0 flex-1 rounded-xl bg-dotori-50 px-4 py-3 text-[14px] outline-none transition-all placeholder:text-dotori-400 focus:ring-2 focus:ring-dotori-300"
					/>
					<button
						onClick={addTag}
						disabled={!tagInput.trim()}
						className={cn(
							"shrink-0 rounded-xl px-4 py-3 text-[14px] font-medium transition-all active:scale-[0.97]",
							tagInput.trim()
								? "bg-dotori-900 text-white"
								: "bg-dotori-100 text-dotori-400",
						)}
					>
						추가
					</button>
				</div>
				{facilityTags.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-2">
						{facilityTags.map((tag) => (
							<button
								key={tag}
								onClick={() => removeTag(tag)}
								className="flex items-center gap-1 rounded-full bg-dotori-100 px-3 py-1.5 text-[13px] font-medium text-dotori-600 transition-all active:scale-[0.97]"
							>
								{tag}
								<span className="text-dotori-400">&times;</span>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default function CommunityWritePage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-40 items-center justify-center">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-dotori-300 border-t-dotori-600" />
				</div>
			}
		>
			<CommunityWriteForm />
		</Suspense>
	);
}
