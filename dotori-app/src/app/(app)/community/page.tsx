"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import { BRAND } from "@/lib/brand-assets";
import { fadeIn, fadeUp, stagger, tap } from "@/lib/motion";
import {
	ChatBubbleLeftIcon,
	HeartIcon,
	EyeIcon,
	MapPinIcon,
	PlusIcon,
	SparklesIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, FireIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CommunityEmptyState } from "./_components/CommunityEmptyState";
import {
	categoryLabel,
	categoryStyle,
	tabs,
	tabToCategoryParam,
	type TabLabel,
} from "./_lib/community-constants";
import type {
	CommunityPostWithViews,
	PostsResponse,
	ReverseGeocodeResponse,
	UserMeResponse,
} from "./_lib/community-types";
import { getAnonymousStyle, isHotPost, tagStyle } from "./_lib/community-utils";

export default function CommunityPage() {
	const { data: session } = useSession();
	const userId = session?.user?.id;
	const { addToast } = useToast();
	const [activeTab, setActiveTab] = useState<TabLabel>("전체");
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

	const [gpsVerified, setGpsVerified] = useState<boolean | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);

	const tabEmptyMessages: Record<TabLabel, string> = {
		전체: "이웃들과 이야기를 나눌 첫 글을 함께 시작해보세요",
		"어린이집 이동": "입주 이전 고민을 먼저 공유해볼까요?",
		"입소 고민": "입소 고민을 이야기해주시면 좋은 조언이 모여요",
		"정보 공유": "현장 체험이 담긴 유익한 정보를 올려주세요",
		"자유 토론": "편하게 고민, 생각을 나눠보세요",
	};

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
			if (permission) permission.onchange = null;
		};
	}, [userId]);

	const fetchPosts = useCallback(
		async (pageNum: number, append = false) => {
			if (append) setIsLoadingMore(true);
			else setIsLoading(true);

			setError(null);

			try {
				const params = new URLSearchParams();
				params.set("page", String(pageNum));
				params.set("limit", "20");
				params.set("sort", "createdAt");

				const category = tabToCategoryParam[activeTab];
				if (category) params.set("category", category);

				const res = await apiFetch<PostsResponse>(
					`/api/community/posts?${params.toString()}`,
				);

				if (append) {
					setPosts((prev) => [...prev, ...res.data]);
				} else {
					setPosts(res.data);
				}

				if (userId) {
					const liked = new Set<string>();
					for (const post of res.data) {
						if (post.likedBy?.includes(userId)) liked.add(post.id);
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
			fetchPosts(1);
		} finally {
			setLikingPosts((prev) => {
				const next = new Set(prev);
				next.delete(postId);
				return next;
			});
		}
	}, [fetchPosts, likedPosts, likingPosts]);

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
				if (entries[0]?.isIntersecting) loadMore();
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
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 0,
				});
			});

			const { latitude, longitude } = position.coords;
			const geocodeRes = await apiFetch<ReverseGeocodeResponse>(
				`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`,
			);
			const { sido, sigungu, dong } = geocodeRes.data;

			await apiFetch("/api/users/me", {
				method: "PATCH",
				body: JSON.stringify({
					gpsVerified: true,
					region: { sido, sigungu, dong },
				}),
			});

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
			<header className="glass-header sticky top-0 z-20 px-4 pb-1 pt-4">
				<div className="relative flex items-center justify-between pb-3">
					<div className="flex items-center gap-2">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.lockupHorizontalKr} alt="도토리" className="h-5 opacity-90" />
							<Badge color="dotori" className="text-xs font-semibold">
								이웃
							</Badge>
					</div>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.socialCream}
						alt=""
						aria-hidden="true"
						className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 opacity-[0.06]"
					/>
				</div>

				<div className="overflow-x-auto" role="tablist" aria-label="커뮤니티 탭">
					<div className="flex min-w-max gap-2 pb-3">
						{tabs.map((tab) => {
							const isActive = activeTab === tab;
							return (
								<Button
									plain={true}
									type="button"
									key={tab}
									role="tab"
									aria-selected={isActive}
									onClick={() => setActiveTab(tab)}
									className={cn(
											"min-h-[52px] min-w-max rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
											isActive
												? "bg-dotori-900 text-white shadow-md shadow-dotori-200 dark:bg-dotori-500 dark:shadow-none"
												: "border border-dotori-100 bg-white text-dotori-700 hover:bg-dotori-100/70 dark:border-dotori-800 dark:bg-dotori-950 dark:text-dotori-100 dark:hover:bg-dotori-900",
										)}
									>
									{tab}
								</Button>
							);
						})}
					</div>
				</div>
			</header>

			<div className="px-4 pt-4">
				{isTransitionMonth ? (
						<motion.div
							{...fadeUp}
							className="mb-4 rounded-2xl bg-forest-50 p-4 text-sm text-forest-700 dark:bg-dotori-900 dark:text-forest-200"
						>
							<span className="font-semibold">반편성 시즌</span>이에요. 이동 고민을 이웃과
							나눠보세요.
						</motion.div>
				) : null}

				{userId &&
					gpsVerified === false &&
					hasGeolocationPermission !== true && (
						<Button
							plain={true}
							type="button"
							onClick={handleGpsVerify}
							disabled={isVerifying}
							className={cn(
								"mb-4 flex w-full items-center gap-3 rounded-2xl bg-forest-50 p-4 text-left transition-all active:scale-[0.98] dark:bg-dotori-900",
								isVerifying && "opacity-70",
							)}
						>
							<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 dark:bg-dotori-800">
								{isVerifying ? (
									<div className="h-5 w-5 animate-spin rounded-full border-2 border-forest-300 border-t-forest-600" />
								) : (
									<MapPinIcon className="h-5 w-5 text-forest-600 dark:text-forest-300" />
								)}
							</div>
							<div className="min-w-0 flex-1">
									<p className="text-base font-semibold text-forest-800 dark:text-forest-200">
										{isVerifying ? "위치 확인 중..." : "동네 인증하기"}
									</p>
									<p className="text-sm text-forest-600 dark:text-forest-200/80">
										{isVerifying
											? "GPS로 현재 위치를 확인하고 있어요"
											: "GPS로 내 동네를 인증하고 이웃과 소통해보세요"}
									</p>
							</div>
							{!isVerifying && (
									<Badge color="forest" className="shrink-0 text-xs font-medium">
										인증
									</Badge>
								)}
							</Button>
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
					<div>
						<motion.ul {...stagger.container} className="space-y-3.5">
						{posts.map((post) => {
							const anonStyle = getAnonymousStyle(post.id);
							const postHot = isHotPost(post);

							return (
								<motion.li
									key={post.id}
									{...stagger.item}
									{...tap.card}
									className={cn(
										"rounded-[28px] border border-dotori-100 bg-white p-5 shadow-[0_12px_24px_rgba(200,149,106,0.08)] dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none",
									)}
								>
									<div className="relative rounded-2xl bg-gradient-to-b from-dotori-50/70 to-white p-4 dark:from-dotori-900/70 dark:to-dotori-950">
										<div className="mb-2 flex items-start justify-between gap-2">
											<div className="flex min-w-0 items-start gap-2.5">
												<div
													className={cn(
														"mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-2",
														anonStyle.bg,
														anonStyle.ring,
													)}
												>
													<UserCircleIcon className={cn("h-5 w-5", anonStyle.icon)} />
												</div>
												<div className="min-w-0 flex-1">
														<p className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
															익명 부모
														</p>
														<div className="mt-1 flex flex-wrap items-center gap-1.5">
															{post.author.verified ? (
																<Badge color="forest" className="text-xs font-medium">
																	인증
																</Badge>
															) : null}
															{post.category && categoryLabel[post.category] ? (
																<span
																	className={cn(
																		"rounded-full px-2 py-0.5 text-xs font-medium",
																		categoryStyle[post.category],
																	)}
																>
																	{categoryLabel[post.category]}
																</span>
														) : null}
													</div>
												</div>
											</div>
												<p
													className="shrink-0 text-sm text-dotori-600 dark:text-dotori-300"
													suppressHydrationWarning
												>
													{formatRelativeTime(post.createdAt)}
												</p>
											</div>

											{postHot ? (
												<div className="mb-2 inline-flex items-center gap-1 rounded-full bg-forest-600/10 px-2.5 py-1 text-xs font-semibold text-forest-700 dark:bg-dotori-900 dark:text-forest-200">
													<FireIcon className="h-4 w-4" />
													인기
												</div>
											) : null}

											<Link href={`/community/${post.id}`} className="block">
												<p className="min-h-[56px] text-base leading-relaxed text-dotori-800 dark:text-dotori-100">
													{post.content}
												</p>
											</Link>

										{post.facilityTags && post.facilityTags.length > 0 ? (
											<div className="mt-2.5 flex flex-wrap gap-2">
												{post.facilityTags.map((tag) => (
													<Link
														key={tag}
															href={`/explore?q=${encodeURIComponent(tag)}`}
															className={cn(
																"rounded-full px-3 py-1.5 text-sm font-medium transition-colors active:scale-[0.97]",
																tagStyle(tag),
															)}
														>
															{tag}
														</Link>
												))}
											</div>
										) : null}

										{post.aiSummary ? (
											<div className="mt-2.5">
												<Button
													plain={true}
													type="button"
													onClick={() =>
														setShowAiSummary((prev) => ({
															...prev,
															[post.id]: !prev[post.id],
														}))
														}
														className={cn(
															"flex min-h-[56px] items-center gap-1.5 py-2 text-sm font-medium transition-colors",
															showAiSummary[post.id]
																? "text-dotori-700 dark:text-dotori-100"
																: "text-dotori-500 dark:text-dotori-300",
														)}
													>
													<SparklesIcon className="h-4 w-4" />
													{showAiSummary[post.id] ? "AI 요약 접기" : "AI 요약"}
												</Button>
													{showAiSummary[post.id] ? (
														<motion.div
															{...fadeIn}
															className="mt-1.5 rounded-xl bg-dotori-50 p-3 dark:bg-dotori-900/60"
														>
															<p className="text-sm leading-relaxed text-dotori-600 dark:text-dotori-200">
																{post.aiSummary}
															</p>
														</motion.div>
													) : null}
												</div>
										) : null}
									</div>

										<div className="mt-3 grid grid-cols-3 gap-2 text-sm">
											<Button
												plain={true}
												type="button"
												onClick={() => toggleLike(post.id)}
												disabled={likingPosts.has(post.id)}
											aria-label={likedPosts.has(post.id) ? "좋아요 취소" : "좋아요"}
											className={cn(
												"flex min-h-[56px] items-center justify-center gap-1.5 rounded-xl transition-colors active:scale-[0.97]",
												likedPosts.has(post.id)
													? "bg-forest-50 text-forest-700 dark:bg-dotori-900 dark:text-forest-200"
													: "bg-dotori-50/70 text-dotori-600 hover:bg-dotori-100/70 dark:bg-dotori-900/60 dark:text-dotori-200 dark:hover:bg-dotori-800",
											)}
										>
											{likedPosts.has(post.id) ? (
												<HeartSolidIcon className="h-5 w-5" />
											) : (
												<HeartIcon className="h-5 w-5" />
											)}
											{post.likes}
										</Button>
										<Link
											href={`/community/${post.id}`}
											aria-label="댓글"
											className="flex min-h-[56px] items-center justify-center gap-1.5 rounded-xl bg-dotori-50/70 text-dotori-600 transition-colors hover:bg-dotori-100/70 dark:bg-dotori-900/60 dark:text-dotori-200 dark:hover:bg-dotori-800"
										>
											<ChatBubbleLeftIcon className="h-5 w-5" />
											{post.commentCount}
										</Link>
										<div className="flex min-h-[56px] items-center justify-center gap-1.5 rounded-xl bg-dotori-50/70 text-dotori-600 dark:bg-dotori-900/60 dark:text-dotori-300">
											<EyeIcon className="h-5 w-5" />
											조회 {post.viewCount ?? 0}
										</div>
									</div>
								</motion.li>
							);
						})}
						</motion.ul>

						{isLoadingMore ? (
							<div className="mt-4 flex flex-col items-center py-4">
								<div className="h-6 w-6 animate-spin rounded-full border-2 border-dotori-200 border-t-dotori-700" />
								<p className="mt-2 text-sm text-dotori-600 dark:text-dotori-300">
									다음 글을 불러오는 중...
								</p>
							</div>
						) : null}
						<div ref={loadMoreTriggerRef} className="h-2" />
					</div>
				) : (
					<CommunityEmptyState message={tabEmptyMessages[activeTab]} />
				)}
			</div>

			<Link
				href="/community/write"
				aria-label="글쓰기"
				className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-4 z-50 rounded-full bg-dotori-900 p-0 shadow-lg shadow-dotori-900/20 ring-2 ring-white/80 transition-all hover:bg-dotori-800 hover:shadow-xl active:scale-[0.97] dark:bg-dotori-500 dark:hover:bg-dotori-400 dark:shadow-none dark:ring-dotori-900/60"
				style={{ width: "56px", height: "56px" }}
			>
				<div className="grid h-full w-full place-items-center text-white">
					<PlusIcon className="h-6 w-6" />
				</div>
			</Link>
		</div>
	);
}
