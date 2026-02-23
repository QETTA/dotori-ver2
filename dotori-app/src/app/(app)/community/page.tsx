"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { DS_GLASS, DS_STATUS } from "@/lib/design-system/tokens";
import { cn, formatRelativeTime } from "@/lib/utils";
import { BRAND } from "@/lib/brand-assets";
import { fadeIn, fadeUp, stagger, tap } from "@/lib/motion";
import {
	HeartIcon,
	MapPinIcon,
	PlusIcon,
	ChatBubbleLeftRightIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, FireIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CommunityEmptyState } from "./_components/CommunityEmptyState";
import {
	categoryLabel,
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
import { tagStyle } from "./_lib/community-utils";

const CATEGORY_BADGE_COLOR: Record<
	CommunityPostWithViews["category"],
	"forest" | undefined
> = {
	feedback: "forest",
	review: "forest",
	question: "forest",
	info: undefined,
};

const WARM_SURFACE =
	"bg-gradient-to-br from-dotori-50 via-amber-50/45 to-white dark:from-dotori-900 dark:via-dotori-900 dark:to-dotori-950";
const MOTION_SMOOTH = "transition-transform duration-200 ease-out";

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
	const communityStats = useMemo(
		() => [
			{ label: "피드 수", value: `${posts.length}` },
			{ label: "인증 글", value: `${posts.filter((post) => post.author.verified).length}` },
			{
				label: "반응",
				value: `${posts.reduce((acc, post) => acc + post.likes + post.commentCount, 0)}`,
			},
		],
		[posts],
	);

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
			<header className={cn("sticky top-0 z-20 border-b border-dotori-100/70 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]", DS_GLASS.HEADER)}>
				<div className="relative flex min-h-11 items-center justify-between gap-3 pb-2">
					<div className="flex min-w-0 items-center gap-2">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.lockupHorizontalKr} alt="도토리" className="h-5 opacity-90" />
						<Badge color="forest" className="text-label font-semibold">
							이웃
						</Badge>
					</div>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.symbol}
						alt=""
						aria-hidden="true"
						className="pointer-events-none absolute right-0 top-1/2 h-7 w-7 -translate-y-1/2 opacity-[0.22]"
					/>
				</div>

				<nav className="overflow-x-auto" aria-label="커뮤니티 카테고리">
					<div className="flex min-w-max gap-2 pb-2">
						{tabs.map((tab) => {
							const isActive = activeTab === tab;
							return (
								<motion.div key={tab} {...tap.chip}>
									<Button
										plain={true}
										type="button"
										aria-pressed={isActive}
										onClick={() => setActiveTab(tab)}
										className={cn(
											"min-h-11 min-w-max rounded-full px-4 text-label active:scale-100 transition-transform",
											isActive
												? "bg-dotori-900 text-white shadow-sm shadow-dotori-200 dark:bg-dotori-500 dark:shadow-none"
												: "border border-dotori-200 bg-white/80 text-dotori-600 hover:bg-dotori-100/70 dark:border-dotori-800 dark:bg-dotori-950 dark:text-dotori-200 dark:hover:bg-dotori-900",
										)}
									>
										{tab}
									</Button>
								</motion.div>
							);
						})}
					</div>
				</nav>
			</header>

			<div className="px-4 pt-4">
				<motion.section {...fadeUp} className="mb-4">
					<div className={cn("relative overflow-hidden rounded-3xl border border-dotori-100/70 bg-dotori-50/75 p-4 ring-1 ring-dotori-100/70 shadow-sm", DS_GLASS.CARD)}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.watermark}
							alt=""
							aria-hidden="true"
							className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08] dark:opacity-[0.14]"
						/>
						<div className="relative">
							<Badge color="forest" className="text-label font-semibold">
								NEIGHBOR SIGNAL
							</Badge>
							<h2 className={cn("text-h2 mt-2 font-semibold text-dotori-900 dark:text-dotori-50")}>
								내 동네 이동 인사이트 피드
							</h2>
							<p className={cn("text-body-sm mt-1 text-dotori-700 dark:text-dotori-200")}>
								브랜드 소셜 에셋 기반으로 이웃 후기와 실시간 반응을 빠르게 확인하세요.
							</p>
							<div className="mt-3 grid grid-cols-3 gap-2 border-t border-dotori-100/80 pt-3">
								{communityStats.map((stat) => (
									<div
										key={stat.label}
										className="rounded-xl border border-dotori-100/70 bg-white/90 px-2 py-2 text-center dark:border-dotori-800/70 dark:bg-dotori-950/80"
									>
										<p className={cn("text-caption text-dotori-500 dark:text-dotori-300")}>
											{stat.label}
										</p>
										<p className={cn("text-body mt-0.5 font-semibold text-dotori-900 dark:text-dotori-50")}>
											{stat.value}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</motion.section>

				{isTransitionMonth ? (
						<motion.div
							{...fadeUp}
							className={cn(
								"mb-4 rounded-3xl p-4 text-forest-700 ring-1 ring-dotori-100/70 shadow-sm shadow-dotori-100/60 dark:text-forest-200 dark:ring-dotori-700/50 dark:shadow-none",
								WARM_SURFACE,
								DS_GLASS.CARD,
								"text-body-sm",
							)}
						>
							<span className="font-semibold">반편성 시즌</span>이에요. 이동 고민을 이웃과
							나눠보세요.
						</motion.div>
				) : null}

				{userId &&
					gpsVerified === false &&
					hasGeolocationPermission !== true && (
						<motion.div {...fadeIn}>
							<motion.div {...tap.button} className="mb-4">
								<Button
									type="button"
									color="dotori"
									onClick={handleGpsVerify}
									disabled={isVerifying}
									className={cn(
										"flex min-h-11 w-full items-center gap-3 rounded-3xl p-4 text-left ring-1 ring-dotori-100/70 shadow-sm shadow-dotori-100/60 dark:ring-dotori-700/50 dark:shadow-none",
										MOTION_SMOOTH,
										WARM_SURFACE,
										DS_GLASS.CARD,
										isVerifying && "opacity-70",
									)}
								>
									<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100/80 dark:bg-dotori-800">
										{isVerifying ? (
											<div className="h-5 w-5 animate-spin rounded-full border-2 border-forest-300 border-t-forest-600" />
										) : (
											<MapPinIcon className="h-5 w-5 text-forest-600 dark:text-forest-300" />
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className={cn("text-body font-semibold text-forest-800 dark:text-forest-200")}>
											{isVerifying ? "위치 확인 중..." : "동네 인증하기"}
										</p>
										<p className={cn("text-body-sm text-forest-600 dark:text-forest-200/80")}>
											{isVerifying
												? "GPS로 현재 위치를 확인하고 있어요"
												: "GPS로 내 동네를 인증하고 이웃과 소통해보세요"}
										</p>
									</div>
									{!isVerifying && (
										<Badge
											color="forest"
											className={cn("shrink-0 text-label", DS_STATUS.available.pill)}
										>
											인증
										</Badge>
									)}
								</Button>
							</motion.div>
						</motion.div>
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
							<motion.ul {...stagger.container} className="space-y-3">
						{posts.map((post) => {
							const isPopularPost = post.likes >= 3;
							const postBadgeToneClass = isPopularPost
								? DS_STATUS.full.pill
								: DS_STATUS.available.pill;
							const postCategoryBadgeColor =
								CATEGORY_BADGE_COLOR[post.category];
							const postTitle =
								post.title?.trim() ||
								(post.content.length > 30
									? `${post.content.slice(0, 30)}...`
									: post.content);

								return (
									<motion.li
										key={post.id}
										{...stagger.item}
										{...tap.card}
										className={cn(
											"relative overflow-hidden rounded-3xl p-4 shadow-sm",
											MOTION_SMOOTH,
											DS_GLASS.CARD,
											isPopularPost
												? "ring-1 ring-dotori-200/90 bg-gradient-to-b from-dotori-50 via-amber-50/45 to-white shadow-dotori-200/50 dark:from-dotori-900 dark:via-dotori-900 dark:to-dotori-950 dark:ring-dotori-700 dark:shadow-none"
												: "ring-1 ring-dotori-100/80 bg-gradient-to-b from-dotori-50 via-dotori-50/60 to-white shadow-dotori-100/70 dark:from-dotori-900 dark:to-dotori-950 dark:ring-dotori-800 dark:shadow-none",
										)}
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={BRAND.watermark}
											alt=""
											aria-hidden="true"
											className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 opacity-[0.06]"
										/>
										<div className="flex flex-wrap items-center gap-2 border-b border-dotori-100/70 pb-2">
										{post.category && categoryLabel[post.category] ? (
											<Badge
												color={postCategoryBadgeColor}
												className={cn("text-label font-semibold", postBadgeToneClass)}
											>
												{categoryLabel[post.category]}
											</Badge>
										) : null}
										{post.author.verified ? (
											<Badge
												color="forest"
												className={cn("text-label font-medium", DS_STATUS.available.pill)}
											>
												인증
											</Badge>
										) : null}
										{isPopularPost ? (
											<Badge
												color="forest"
												className={cn(
													"inline-flex items-center gap-1 text-label font-semibold",
													postBadgeToneClass,
												)}
											>
												<FireIcon className="h-3.5 w-3.5" />
												인기
											</Badge>
										) : null}
									</div>

									<Link href={`/community/${post.id}`} className="mt-3 block border-b border-dotori-100/70 pb-3">
										<h3 className={cn("text-h3 font-semibold text-dotori-900 dark:text-dotori-50")}>
											{postTitle}
										</h3>
										<p className={cn("text-body-sm mt-1 line-clamp-2 text-dotori-600 dark:text-dotori-300")}>
											{post.content}
										</p>
									</Link>

									{post.facilityTags && post.facilityTags.length > 0 ? (
										<div className="mt-3 flex flex-wrap gap-2">
											{post.facilityTags.map((tag) => (
												<Link
													key={tag}
													href={`/explore?q=${encodeURIComponent(tag)}`}
													className={cn(
														"inline-flex min-h-11 items-center rounded-full px-3 py-2 text-label font-medium",
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
											<motion.div {...tap.chip}>
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
														"inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-label",
														MOTION_SMOOTH,
														showAiSummary[post.id]
															? "text-dotori-700 hover:bg-dotori-50 dark:text-dotori-100 dark:hover:bg-dotori-950"
															: "text-dotori-500 hover:bg-dotori-50 dark:text-dotori-300 dark:hover:bg-dotori-950",
													)}
												>
													<SparklesIcon className="h-4 w-4" />
													{showAiSummary[post.id] ? "AI 요약 접기" : "AI 요약"}
												</Button>
											</motion.div>
											{showAiSummary[post.id] ? (
												<motion.div
													{...fadeIn}
													className="mt-1.5 rounded-xl bg-gradient-to-br from-dotori-50 via-amber-50/35 to-white p-3 ring-1 ring-dotori-100/70 dark:from-dotori-950 dark:via-dotori-950 dark:to-dotori-900 dark:ring-dotori-700/50"
												>
													<p className={cn("text-body-sm leading-relaxed text-dotori-600 dark:text-dotori-200")}>
														{post.aiSummary}
													</p>
												</motion.div>
											) : null}
										</div>
									) : null}

									<div className="mt-3 flex items-center justify-between gap-2 text-caption text-dotori-500 dark:text-dotori-400">
										<p className="min-w-0 truncate" suppressHydrationWarning>
											익명 부모 · {formatRelativeTime(post.createdAt)}
										</p>
										<div className="ml-auto flex items-center gap-2">
											<motion.div {...tap.button}>
												<Button
													plain={true}
													type="button"
													onClick={() => toggleLike(post.id)}
													disabled={likingPosts.has(post.id)}
													aria-label={likedPosts.has(post.id) ? "좋아요 취소" : "좋아요"}
													className={cn(
														"inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-label transition-colors",
														likedPosts.has(post.id)
															? "text-forest-700 hover:bg-forest-50 dark:text-forest-200 dark:hover:bg-dotori-950"
															: "text-dotori-500 hover:bg-dotori-50 dark:text-dotori-300 dark:hover:bg-dotori-950",
													)}
												>
													{likedPosts.has(post.id) ? (
														<HeartSolidIcon className="h-4 w-4" />
													) : (
														<HeartIcon className="h-4 w-4" />
													)}
													좋아요 {post.likes}
												</Button>
											</motion.div>
											<span className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2.5 py-1.5 text-caption text-dotori-500 dark:text-dotori-300">
												<ChatBubbleLeftRightIcon className="h-4 w-4" />
												댓글 {post.commentCount}
											</span>
										</div>
									</div>
								</motion.li>
							);
						})}
						</motion.ul>

						{isLoadingMore ? (
							<div className="mt-4 flex flex-col items-center py-4">
								<div className="h-6 w-6 animate-spin rounded-full border-2 border-dotori-200 border-t-dotori-700" />
								<p className="mt-2 text-body-sm text-dotori-600 dark:text-dotori-300">
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

			{!isLoading && !error && posts.length > 0 ? (
				<motion.div
					{...tap.button}
					className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50"
				>
					<Link
						href="/community/write"
						aria-label="글쓰기"
						className={cn(
							"grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-dotori-900 via-dotori-800 to-dotori-700 shadow-lg shadow-dotori-900/20 ring-2 ring-white/80 dark:from-dotori-500 dark:via-dotori-500 dark:to-dotori-400 dark:shadow-none dark:ring-dotori-900/60",
							DS_GLASS.FLOAT,
						)}
					>
						<PlusIcon className="h-6 w-6 text-white" />
					</Link>
				</motion.div>
			) : null}
		</div>
	);
}
