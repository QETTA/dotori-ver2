"use client";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState, Suspense } from "react";
import { useToast } from "@/components/dotori/ToastProvider";
import { Button } from "@/components/catalyst/button";

const categories = [
	{
		key: "question",
		label: "질문",
		baseClass:
			"bg-dotori-50 text-dotori-700 border-dotori-200 dark:bg-dotori-900 dark:text-dotori-100 dark:border-dotori-700",
		activeClass:
			"bg-dotori-900 text-white border-dotori-900 dark:bg-dotori-500 dark:border-dotori-500",
	},
	{
		key: "review",
		label: "후기",
		baseClass:
			"bg-forest-50 text-forest-700 border-forest-200 dark:bg-dotori-900 dark:text-forest-200 dark:border-dotori-700",
		activeClass: "bg-forest-800 text-white border-forest-800",
	},
	{
		key: "transition",
		label: "이동고민",
		baseClass:
			"bg-dotori-100 text-dotori-700 border-dotori-200 dark:bg-dotori-900 dark:text-dotori-100 dark:border-dotori-700",
		activeClass:
			"bg-dotori-700 text-white border-dotori-700 dark:bg-dotori-500 dark:border-dotori-500",
	},
	{
		key: "info",
		label: "정보공유",
		baseClass:
			"bg-dotori-100 text-dotori-800 border-dotori-300 dark:bg-dotori-900 dark:text-dotori-100 dark:border-dotori-700",
		activeClass:
			"bg-dotori-700 text-white border-dotori-700 dark:bg-dotori-500 dark:border-dotori-500",
	},
	{
		key: "feedback",
		label: "모임",
		baseClass:
			"bg-forest-100 text-forest-600 border-forest-300 dark:bg-dotori-900 dark:text-forest-200 dark:border-dotori-700",
		activeClass: "bg-forest-700 text-white border-forest-700",
	},
];

function CommunityWriteForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { addToast } = useToast();
	const imageInputRef = useRef<HTMLInputElement>(null);

	const presetFacilityId = searchParams.get("facilityId") || "";
	const presetFacilityName = searchParams.get("facilityName") || "";

	const [content, setContent] = useState("");
	const [category, setCategory] = useState("");
	const [title, setTitle] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [facilityTags, setFacilityTags] = useState<string[]>([]);
	const [facilityId, setFacilityId] = useState(presetFacilityId);
	const [imageFiles, setImageFiles] = useState<string[]>([]);
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

	function onImageChange(e: ChangeEvent<HTMLInputElement>) {
		const nextFiles = Array.from(e.target.files ?? []).map((file) => file.name).slice(0, 5);
		setImageFiles(nextFiles);
	}

	function clearImages() {
		setImageFiles([]);
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}
	}

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
		if (isSubmitting) return;

		const trimmedContent = content.trim();
		const trimmedTitle = title.trim();
		if (!category) {
			addToast({
				type: "error",
				message: "카테고리를 먼저 선택해주세요",
			});
			return;
		}
		if (trimmedContent.length < 10) {
			addToast({
				type: "error",
				message: "내용은 10자 이상 입력해주세요",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await apiFetch<{ data: { id: string } }>("/api/community/posts", {
				method: "POST",
				body: JSON.stringify({
					title: trimmedTitle,
					content: trimmedContent,
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

	const canSubmit = category && content.trim().length >= 10;

	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="glass-header sticky top-0 z-20 flex items-center justify-between px-4 py-3">
				<button
					onClick={() => router.push("/community")}
					aria-label="뒤로 가기"
					className="inline-flex items-center rounded-full px-3 py-2.5 text-sm font-medium text-dotori-700 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:text-dotori-100 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
					<span className="ml-1.5 inline-block">취소</span>
				</button>
				<h1 className="text-base font-bold text-dotori-900 dark:text-dotori-50">
					글쓰기
				</h1>
				<Button
					color="dotori"
					onClick={handleSubmit}
					disabled={!canSubmit || isSubmitting}
					className={cn(
						"rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.97]",
					)}
				>
					{isSubmitting ? "등록 중..." : "등록"}
				</Button>
			</header>

			{/* 시설 연동 배지 */}
			{presetFacilityName && (
				<div className="px-5 pt-3">
					<span className="inline-flex items-center gap-1 rounded-full bg-dotori-100 px-3 py-1.5 text-sm font-medium text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100">
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
			<div className="px-5 pt-4">
				<h3 className="mb-2 text-sm font-medium text-dotori-700 dark:text-dotori-200">
					카테고리
				</h3>
				<div className="flex flex-wrap gap-2">
					{categories.map((cat) => {
						const isActive = category === cat.key;
						return (
							<button
								key={cat.key}
								onClick={() => setCategory(cat.key)}
								className={cn(
									"rounded-full border px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97]",
									isActive ? cat.activeClass : cat.baseClass,
								)}
								type="button"
							>
								{cat.label}
							</button>
						);
					})}
				</div>
				{!category && (
					<p className="mt-2 text-xs text-dotori-600 dark:text-dotori-300">
						카테고리를 선택해주세요.
					</p>
				)}
			</div>
			<p className="text-sm text-dotori-600 dark:text-dotori-300">
				이 게시글은 이웃들에게 익명으로 표시됩니다.
			</p>

			{/* 제목 입력 */}
			<div className="flex gap-2 px-5 pt-4">
				<label htmlFor="community-post-title" className="sr-only">
					제목
				</label>
				<input
					id="community-post-title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="제목을 입력해주세요"
					maxLength={120}
					aria-required="true"
					className="w-full rounded-2xl bg-dotori-50 px-4 py-3 text-base text-dotori-900 outline-none transition-all placeholder:text-dotori-500 focus:ring-2 focus:ring-dotori-500 dark:bg-dotori-900 dark:text-dotori-50 dark:placeholder:text-dotori-600"
				/>
			</div>

			{/* 본문 입력 */}
			<div className="mt-2 px-5">
				<label htmlFor="community-post-content" className="sr-only">
					내용
				</label>
				<textarea
					id="community-post-content"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder={
						presetFacilityName
							? `${presetFacilityName}에 대한 후기를 남겨주세요`
							: "이웃에게 공유하고 싶은 내용을 작성해주세요"
					}
					rows={10}
					maxLength={5000}
					aria-required="true"
					className="w-full resize-none rounded-2xl bg-dotori-50 p-4 text-base leading-relaxed text-dotori-900 outline-none transition-all placeholder:text-dotori-500 focus:ring-2 focus:ring-dotori-500 dark:bg-dotori-900 dark:text-dotori-50 dark:placeholder:text-dotori-600"
				/>
				{content.trim().length > 0 && content.trim().length < 10 ? (
					<p className="mt-1.5 text-xs text-dotori-600 dark:text-dotori-300">
						내용은 최소 10자 이상이어야 합니다.
					</p>
				) : null}
				<div className="mt-1 text-right text-xs text-dotori-600 dark:text-dotori-300">
					{content.length}/5000
				</div>
			</div>

			{/* 이미지 첨부 (UI only) */}
			<div className="mt-5 px-5">
				<h3 className="mb-2 text-sm font-medium text-dotori-700 dark:text-dotori-200">
					이미지 첨부 (선택)
				</h3>
				<div className="flex flex-wrap items-center gap-2">
					<input
						ref={imageInputRef}
						onChange={onImageChange}
						id="community-image-input"
						type="file"
						accept="image/*"
						multiple
						className="sr-only"
					/>
					<label
						htmlFor="community-image-input"
						className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-dotori-100 px-4 py-2.5 text-sm font-medium text-dotori-700 transition-all active:scale-[0.97] dark:bg-dotori-800 dark:text-dotori-100"
					>
						사진 선택
					</label>
					{imageFiles.length > 0 ? (
						<button
							onClick={clearImages}
							type="button"
							className="inline-flex min-h-11 items-center rounded-xl bg-dotori-50 px-4 py-2.5 text-sm font-medium text-dotori-700 transition-all active:scale-[0.97] dark:bg-dotori-900 dark:text-dotori-100"
						>
							선택 초기화
						</button>
					) : null}
				</div>
				{imageFiles.length > 0 ? (
					<ul className="mt-2 space-y-1 text-sm text-dotori-700 dark:text-dotori-100">
						{imageFiles.map((name) => (
							<li
								key={name}
								className="rounded-lg bg-dotori-50 px-3 py-2 dark:bg-dotori-900"
							>
								{name}
							</li>
						))}
					</ul>
				) : (
					<p className="mt-2 text-xs text-dotori-600 dark:text-dotori-300">
						첨부한 이미지가 없습니다. 현재는 첨부 UI만 제공합니다.
					</p>
				)}
			</div>

			{/* 시설 태그 */}
			<div className="mt-4 px-5">
				<h3 className="mb-2 text-sm font-medium text-dotori-600 dark:text-dotori-300">
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
						className="min-w-0 flex-1 rounded-xl bg-dotori-50 px-4 py-3 text-sm text-dotori-900 outline-none transition-all placeholder:text-dotori-500 focus:ring-2 focus:ring-dotori-500 dark:bg-dotori-900 dark:text-dotori-50 dark:placeholder:text-dotori-600"
					/>
					<button
						onClick={addTag}
						disabled={!tagInput.trim()}
						className={cn(
							"shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.97]",
							tagInput.trim()
								? "bg-dotori-900 text-white dark:bg-dotori-500"
								: "bg-dotori-100 text-dotori-500 dark:bg-dotori-800 dark:text-dotori-300",
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
								className="flex items-center gap-1 rounded-full bg-dotori-100 px-3 py-1.5 text-sm font-medium text-dotori-600 transition-all active:scale-[0.97] dark:bg-dotori-800 dark:text-dotori-100"
							>
								{tag}
								<span className="text-dotori-500 dark:text-dotori-300">&times;</span>
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
