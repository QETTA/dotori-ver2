"use client";

import { Badge } from "@/components/catalyst/badge";
import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import { BRAND } from "@/lib/brand-assets";
import type { CommunityPost } from "@/types/dotori";
import {
	ChatBubbleLeftIcon,
	ArrowPathIcon,
	HeartIcon,
	EyeIcon,
	MapPinIcon,
	PencilSquareIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

const tabs = ["전체", "정보공유", "질문", "후기", "이동고민", "모임"];

const categoryLabel: Record<string, string> = {
	feedback: "모임",
	question: "질문",
	review: "후기",
	transition: "이동고민",
	info: "정보공유",
};

const categoryStyle: Record<string, string> = {
	feedback: "bg-dotori-100 text-dotori-600",
	question: "bg-blue-50 text-blue-600",
	review: "bg-forest-50 text-forest-600",
	transition: "bg-emerald-50 text-emerald-600",
	info: "bg-dotori-100 text-dotori-600",
};

const tabToCategoryParam: Record<string, string> = {
	전체: "",
	정보공유: "info",
	질문: "question",
	후기: "review",
	이동고민: "transition",
	모임: "feedback",
};

const tabEmptyMessages: Record<string, string> = {
	전체: "아직 이웃 글이 없어요. 첫 글을 작성해보세요!",
	질문: "궁금한 점을 이웃에게 물어보세요",
	후기: "어린이집 후기를 공유해보세요",
};

type CommunityPostWithViews = CommunityPost & { viewCount?: number };

const facilityTypes = new Set(["국공립", "민간", "가정", "직장", "협동", "사회복지"]);

function tagStyle(tag: string): string {
	if (facilityTypes.has(tag)) return "bg-purple-50 text-purple-600";
	return "bg-sky-50 text-sky-600"; // 지역명
}

interface PostsResponse {
	data: CommunityPostWithViews[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface UserMeResponse {
	data: {
		gpsVerified: boolean;
		region?: { sido: string; sigungu: string; dong?: string };
	};
}

interface ReverseGeocodeResponse {
	data: { sido: string; sigungu: string; dong: string };
}

export default function CommunityPage() {
	const { data: session } = useSession();
	const userId = session?.user?.id;
	const { addToast } = useToast();
	const [activeTab, setActiveTab] = useState("전체");
	const [showAiSummary, setShowAiSummary] = useState<Record<string, boolean>>(
		{},
	);
	const [posts, setPosts] = useState<CommunityPostWithViews[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
	const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasGeolocationPermission, setHasGeolocationPermission] = useState<boolean | null>(
		null,
	);
	const isTransitionMonth = new Date().getMonth() <= 2;
	const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

	// GPS verification state
	const [gpsVerified, setGpsVerified] = useState<boolean | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);

	// Fetch user GPS verification status
	useEffect(() => {
		if (!userId) return;
		apiFetch<UserMeResponse>("/api/users/me")
			.then((res) => {
				setGpsVerified(res.data.gpsVerified);
			})
			.catch(() => {
				// Silently fail — banner will stay hidden if null
			});
	}, [userId]);

	// Check browser geolocation permission to avoid showing banner unnecessarily
	useEffect(() => {
		if (!userId || typeof navigator === "undefined") return;

		let permission: PermissionStatus | null = null;
		let isMounted = true;

		const checkPermission = async () => {
			if (!("permissions" in navigator)) {
				if (isMounted) setHasGeolocationPermission(false);
				return;
			}

			try {
				permission = await navigator.permissions.query({
					name: "geolocation",
				} as PermissionDescriptor);

				if (!isMounted) return;

				setHasGeolocationPermission(permission.state === "granted");

				permission.onchange = () => {
					if (!isMounted) return;
					setHasGeolocationPermission(permission?.state === "granted");
				};
			} catch {
				if (isMounted) setHasGeolocationPermission(false);
			}
		};

		checkPermission();

		return () => {
			isMounted = false;
			if (permission) {
				permission.onchange = null;
			}
		};
	}, [userId]);

	const fetchPosts = useCallback(
		async (pageNum: number, append = false) => {
			if (append) {
				setIsLoadingMore(true);
			} else {
				setIsLoading(true);
			}
			setError(null);

			try {
				const params = new URLSearchParams();
				params.set("page", String(pageNum));
				params.set("limit", "20");

				params.set("sort", "createdAt");

				const category = tabToCategoryParam[activeTab];
				if (category) {
					params.set("category", category);
				}

				const res = await apiFetch<PostsResponse>(
					`/api/community/posts?${params.toString()}`,
				);

				if (append) {
					setPosts((prev) => [...prev, ...res.data]);
				} else {
					setPosts(res.data);
				}
				// Initialize liked state from server data
				if (userId) {
					const liked = new Set<string>();
					for (const post of res.data) {
						if (post.likedBy?.includes(userId)) {
							liked.add(post.id);
						}
					}
					if (append) {
						setLikedPosts((prev) => {
							const next = new Set(prev);
							for (const id of liked) next.add(id);
							return next;
						});
					} else {
						setLikedPosts(liked);
					}
				}
				setTotalPages(res.pagination.totalPages);
			} catch {
				setError("게시물을 불러오지 못했어요");
			} finally {
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		},
		[activeTab, userId],
	);

	useEffect(() => {
		setPage(1);
		fetchPosts(1);
	}, [fetchPosts]);

	const toggleLike = useCallback(async (postId: string) => {
		if (likingPosts.has(postId)) return;

		setLikingPosts((prev) => new Set(prev).add(postId));
		const isLiked = likedPosts.has(postId);

		try {
			if (isLiked) {
				await apiFetch(`/api/community/posts/${postId}/like`, {
					method: "DELETE",
				});
				setLikedPosts((prev) => {
					const next = new Set(prev);
					next.delete(postId);
					return next;
				});
				setPosts((prev) =>
					prev.map((p) =>
						p.id === postId
							? { ...p, likes: Math.max(0, p.likes - 1) }
							: p,
					),
				);
			} else {
				await apiFetch(`/api/community/posts/${postId}/like`, {
					method: "POST",
				});
				setLikedPosts((prev) => new Set(prev).add(postId));
				setPosts((prev) =>
					prev.map((p) =>
						p.id === postId ? { ...p, likes: p.likes + 1 } : p,
					),
				);
			}
		} catch {
			// Revert: refetch to get true state
			fetchPosts(1);
		} finally {
			setLikingPosts((prev) => {
				const next = new Set(prev);
				next.delete(postId);
				return next;
			});
		}
	}, [likingPosts, likedPosts, fetchPosts]);

	const loadMore = useCallback(() => {
		if (isLoading || isLoadingMore || page >= totalPages) return;
		const nextPage = page + 1;
		setPage(nextPage);
		fetchPosts(nextPage, true);
	}, [fetchPosts, isLoading, isLoadingMore, page, totalPages]);

	useEffect(() => {
		const trigger = loadMoreTriggerRef.current;
		const shouldLoadMore = page < totalPages;

		if (!trigger || !shouldLoadMore || isLoading || isLoadingMore || error) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMore();
				}
			},
			{ rootMargin: "0px 0px 200px 0px", threshold: 0.1 },
		);

		observer.observe(trigger);
		return () => observer.disconnect();
	}, [error, isLoading, isLoadingMore, loadMore, page, totalPages]);

	async function handleGpsVerify() {
		if (isVerifying) return;

		if (!navigator.geolocation) {
			addToast({ type: "error", message: "이 기기에서 위치 서비스를 지원하지 않아요" });
			return;
		}

		setIsVerifying(true);

		try {
			// 1. Get current position
			const position = await new Promise<GeolocationPosition>(
				(resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 0,
					});
				},
			);

			const { latitude, longitude } = position.coords;

			// 2. Reverse geocode via server API
			const geocodeRes = await apiFetch<ReverseGeocodeResponse>(
				`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`,
			);
			const { sido, sigungu, dong } = geocodeRes.data;

			// 3. Update user profile with GPS verification + region
			await apiFetch("/api/users/me", {
				method: "PATCH",
				body: JSON.stringify({
					gpsVerified: true,
					region: { sido, sigungu, dong },
				}),
			});

			// 4. Update local state & show success toast
			setGpsVerified(true);
			setHasGeolocationPermission(true);
			addToast({ type: "success", message: "동네 인증이 완료되었어요" });
		} catch (err) {
			if (err instanceof GeolocationPositionError) {
				switch (err.code) {
					case err.PERMISSION_DENIED:
						addToast({
							type: "error",
							message: "위치 권한을 허용해주세요",
						});
						break;
					case err.POSITION_UNAVAILABLE:
						addToast({
							type: "error",
							message: "위치 정보를 가져올 수 없어요",
						});
						break;
					case err.TIMEOUT:
						addToast({
							type: "error",
							message: "위치 확인 시간이 초과되었어요. 다시 시도해주세요",
						});
						break;
					default:
						addToast({
							type: "error",
							message: "위치 확인에 실패했어요",
						});
				}
			} else {
				addToast({
					type: "error",
					message: "동네 인증에 실패했어요. 다시 시도해주세요",
				});
			}
		} finally {
			setIsVerifying(false);
		}
	}

	return (
		<div className="relative pb-16">
			{/* -- 헤더 -- */}
			<header className="sticky top-0 z-20 bg-white/80 px-5 pb-0 pt-4 backdrop-blur-xl">
				<div className="relative flex items-center justify-between pb-3">
					<h1 className="text-xl font-bold">이웃</h1>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.socialCream} alt="" aria-hidden="true" className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 opacity-[0.06]" />
				</div>

				{/* 탭 -- 밑줄 스타일 */}
				<div className="flex border-b border-dotori-100/40" role="tablist" aria-label="커뮤니티 탭">
					{tabs.map((tab) => (
						<button
							key={tab}
							role="tab"
							aria-selected={activeTab === tab}
							onClick={() => setActiveTab(tab)}
							className={cn(
								"flex-1 flex items-center justify-center gap-1.5 py-3 text-center text-[15px] font-medium transition-all",
								activeTab === tab
									? "border-b-2 border-dotori-900 text-dotori-900"
									: "text-dotori-500",
							)}
						>
							{tab === "이동고민" ? <ArrowPathIcon className="h-4 w-4" /> : null}
							{tab}
						</button>
					))}
				</div>
			</header>

			{/* -- 피드 -- */}
			<div className="px-5 pt-4">
				{isTransitionMonth ? (
					<div className="rounded-2xl bg-forest-50 p-4 mb-4 text-[14px] text-forest-700">
						<span className="font-semibold">반편성 시즌</span>이에요. 이동 고민을 이웃과 나눠보세요.
					</div>
				) : null}

				{/* GPS 인증 배너 — 로그인 + 미인증 시에만 표시 */}
				{userId &&
					gpsVerified === false &&
					hasGeolocationPermission !== true && (
					<button
						onClick={handleGpsVerify}
						disabled={isVerifying}
						className={cn(
							"mb-4 flex w-full items-center gap-3 rounded-2xl bg-forest-50 p-4 text-left transition-all active:scale-[0.98]",
							isVerifying && "opacity-70",
						)}
					>
						<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100">
							{isVerifying ? (
								<div className="h-5 w-5 animate-spin rounded-full border-2 border-forest-300 border-t-forest-600" />
							) : (
								<MapPinIcon className="h-5 w-5 text-forest-600" />
							)}
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-[15px] font-semibold text-forest-800">
								{isVerifying ? "위치 확인 중..." : "동네 인증하기"}
							</p>
							<p className="text-[13px] text-forest-600">
								{isVerifying
									? "GPS로 현재 위치를 확인하고 있어요"
									: "GPS로 내 동네를 인증하고 이웃과 소통해보세요"}
							</p>
						</div>
						{!isVerifying && (
							<Badge color="forest" className="shrink-0 text-[11px] font-medium">
								인증
							</Badge>
						)}
					</button>
				)}

				{isLoading ? (
					<Skeleton variant="community-post" count={3} />
				) : error ? (
					<ErrorState
						message={error}
						action={{
							label: "새로고침",
							onClick: () => {
								setPage(1);
								fetchPosts(1);
							},
						}}
					/>
				) : posts.length > 0 ? (
					<>
						<div className="space-y-3">
							{posts.map((post, index) => (
								<article
									key={post.id}
									className={cn(
										"rounded-3xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
										"motion-safe:animate-in motion-safe:fade-in duration-300",
									)}
									style={{
										animationDelay: `${index * 60}ms`,
										animationFillMode: "both",
									}}
								>
							{/* 작성자 + 카테고리 */}
							<div className="flex items-center gap-2.5">
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-dotori-100 text-[13px] font-bold text-dotori-700">
									?
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-1.5">
										<span className="text-[15px] font-semibold text-dotori-900">
											익명 이웃
										</span>
												{post.author.verified && (
													<Badge
														color="forest"
														className="text-[11px] font-medium"
													>
														인증
													</Badge>
												)}
												{post.category && categoryLabel[post.category] && (
													<span className={cn(
														"rounded px-1.5 py-0.5 text-[11px] font-medium",
														categoryStyle[post.category] || "bg-dotori-50 text-dotori-500"
													)}>
														{categoryLabel[post.category]}
													</span>
												)}
											</div>
											<span
												className="text-[13px] text-dotori-500"
												suppressHydrationWarning
											>
												{formatRelativeTime(post.createdAt)}
											</span>
										</div>
									</div>

									{/* 본문 -- 클릭시 상세 */}
									<Link href={`/community/${post.id}`} className="mt-3 block">
										<p className="text-[15px] leading-relaxed text-dotori-800 line-clamp-4">
											{post.content}
										</p>
									</Link>

									{/* 시설 태그 -- 클릭 가능 */}
									{post.facilityTags && post.facilityTags.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-2">
											{post.facilityTags.map((tag) => (
												<Link
													key={tag}
													href={`/explore?q=${encodeURIComponent(tag)}`}
													className={cn("rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors active:scale-[0.97]", tagStyle(tag))}
												>
													{tag}
												</Link>
											))}
										</div>
									)}

									{/* AI 요약 -- 카드 스타일 */}
									{post.aiSummary && (
										<div className="mt-2.5">
											<button
												onClick={() =>
													setShowAiSummary((prev) => ({
														...prev,
														[post.id]: !prev[post.id],
													}))
												}
												className={cn(
													"flex items-center gap-1.5 py-1 text-[13px] font-medium transition-colors",
													showAiSummary[post.id]
														? "text-dotori-600"
														: "text-dotori-500",
												)}
											>
												<SparklesIcon className="h-4 w-4" />
												{showAiSummary[post.id]
													? "AI 요약 접기"
													: "AI 요약"}
											</button>
											{showAiSummary[post.id] && (
												<div className="mt-1.5 rounded-xl bg-dotori-50 p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 duration-200">
													<p className="text-[13px] leading-relaxed text-dotori-600">
														{post.aiSummary}
													</p>
												</div>
											)}
										</div>
									)}

									{/* 액션 바 */}
									<div className="mt-3 flex items-center gap-4 text-[13px] text-dotori-500">
										<button
											onClick={() => toggleLike(post.id)}
											disabled={likingPosts.has(post.id)}
											aria-label={likedPosts.has(post.id) ? "좋아요 취소" : "좋아요"}
											className={cn(
												"flex min-h-12 items-center gap-1.5 rounded-full px-3 py-2 transition-colors active:scale-[0.97]",
												likedPosts.has(post.id)
													? "text-red-500 hover:bg-red-50"
													: "hover:bg-dotori-50 hover:text-dotori-600",
											)}
										>
											{likedPosts.has(post.id) ? (
												<HeartSolidIcon className="h-5 w-5" />
											) : (
												<HeartIcon className="h-5 w-5" />
											)}
											{post.likes}
										</button>
										<Link
											href={`/community/${post.id}`}
											aria-label="댓글"
											className="flex min-h-12 items-center gap-1.5 rounded-full px-3 py-2 transition-colors hover:bg-dotori-50 hover:text-dotori-600 active:scale-[0.97]"
										>
											<ChatBubbleLeftIcon className="h-5 w-5" />
											{post.commentCount}
										</Link>
										<div className="flex min-h-12 items-center gap-1.5 rounded-full px-3 py-2 text-dotori-500">
											<EyeIcon className="h-5 w-5" />
											조회 {post.viewCount ?? 0}
										</div>
									</div>
								</article>
							))}
						</div>

						{/* 더 보기 */}
						{isLoadingMore && (
							<div className="mt-4 flex justify-center py-2">
								<div
									className="h-5 w-5 rounded-full border-2 border-dotori-100 border-t-dotori-500 animate-spin"
									aria-hidden
								/>
							</div>
						)}
						<div ref={loadMoreTriggerRef} className="mt-4 h-2" />
					</>
				) : (
					<EmptyState
						title={tabEmptyMessages[activeTab] || "아직 게시물이 없어요"}
						actionLabel="글 작성하기"
						actionHref="/community/write"
						secondaryLabel="탐색 페이지 가기"
						secondaryHref="/explore"
					/>
				)}
			</div>

			{/* -- FAB with label -- */}
			<Link
				href="/community/write"
				aria-label="글쓰기"
				className="fixed bottom-24 right-5 z-50 mb-[env(safe-area-inset-bottom)] flex items-center gap-2 rounded-full bg-dotori-500 px-5 py-4 text-white shadow-lg transition-all hover:bg-dotori-600 hover:shadow-xl active:scale-[0.97]"
			>
				<PencilSquareIcon className="h-5 w-5" />
				<span className="text-[14px] font-medium">글쓰기</span>
			</Link>
		</div>
	);
}
