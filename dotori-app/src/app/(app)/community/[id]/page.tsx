"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { glass } from "@/lib/motion";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { CommunityPost } from "@/types/dotori";
import {
	ArrowLeftIcon,
	ChatBubbleLeftIcon,
	HeartIcon,
	PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Comment {
	id: string;
	postId: string;
	authorId: string;
	author: { nickname: string; avatar?: string; verified: boolean };
	content: string;
	likes: number;
	createdAt: string;
}

const categoryLabel: Record<string, string> = {
	question: "질문",
	review: "후기",
	info: "정보",
};

export default function CommunityPostPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { data: session } = useSession();
	const { addToast } = useToast();
	const inputRef = useRef<HTMLInputElement>(null);

	const [post, setPost] = useState<CommunityPost | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [liked, setLiked] = useState(false);
	const [liking, setLiking] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchPost = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [postRes, commentsRes] = await Promise.allSettled([
				apiFetch<{ data: CommunityPost }>(`/api/community/posts/${id}`),
				apiFetch<{ data: Comment[] }>(
					`/api/community/posts/${id}/comments`,
				),
			]);

			if (postRes.status === "fulfilled") {
				const p = postRes.value.data;
				setPost(p);
				if (session?.user?.id && p.likedBy?.includes(session.user.id)) {
					setLiked(true);
				}
			} else {
				setError("게시물을 불러오지 못했어요");
				return;
			}

			if (commentsRes.status === "fulfilled") {
				setComments(commentsRes.value.data);
			}
		} catch {
			setError("게시물을 불러오지 못했어요");
		} finally {
			setIsLoading(false);
		}
	}, [id, session?.user?.id]);

	useEffect(() => {
		fetchPost();
	}, [fetchPost]);

	async function toggleLike() {
		if (liking || !post) return;
		setLiking(true);
		try {
			if (liked) {
				await apiFetch(`/api/community/posts/${id}/like`, {
					method: "DELETE",
				});
				setLiked(false);
				setPost((p) =>
					p ? { ...p, likes: Math.max(0, p.likes - 1) } : p,
				);
			} else {
				await apiFetch(`/api/community/posts/${id}/like`, {
					method: "POST",
				});
				setLiked(true);
				setPost((p) => (p ? { ...p, likes: p.likes + 1 } : p));
			}
		} catch {
			// ignore
		} finally {
			setLiking(false);
		}
	}

	async function submitComment() {
		if (!commentText.trim() || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const res = await apiFetch<{ data: Comment }>(
				`/api/community/posts/${id}/comments`,
				{
					method: "POST",
					body: JSON.stringify({ content: commentText.trim() }),
				},
			);
			setComments((prev) => [...prev, res.data]);
			setCommentText("");
			setPost((p) =>
				p ? { ...p, commentCount: p.commentCount + 1 } : p,
			);
			addToast({ type: "success", message: "댓글이 등록되었어요" });
		} catch {
			addToast({
				type: "error",
				message: "댓글 등록에 실패했어요",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isLoading) {
		return (
			<div className="pb-8">
				<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-5 py-4">
					<button
						onClick={() => router.back()}
						aria-label="뒤로 가기"
						className="rounded-full p-2 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
					>
						<ArrowLeftIcon className="h-5 w-5 text-dotori-900 dark:text-dotori-50" />
					</button>
					<h1 className="text-lg font-bold text-dotori-900 dark:text-dotori-50">
						게시물
					</h1>
				</header>
				<div className="px-5 pt-4">
					<Skeleton variant="card" count={1} />
					<div className="mt-6">
						<Skeleton variant="text" count={4} />
					</div>
				</div>
			</div>
		);
	}

	if (error || !post) {
		return (
			<div className="pb-8">
				<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-5 py-4">
					<button
						onClick={() => router.back()}
						aria-label="뒤로 가기"
						className="rounded-full p-2 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
					>
						<ArrowLeftIcon className="h-5 w-5 text-dotori-900 dark:text-dotori-50" />
					</button>
					<h1 className="text-lg font-bold text-dotori-900 dark:text-dotori-50">
						게시물
					</h1>
				</header>
				<div className="px-5 pt-8">
					<ErrorState
						message={error ?? "게시물을 찾을 수 없어요"}
						action={{
							label: "목록으로",
							onClick: () => router.push("/community"),
						}}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="pb-32">
			{/* 헤더 */}
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-5 py-4">
				<button
					onClick={() => router.back()}
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-5 w-5 text-dotori-900 dark:text-dotori-50" />
				</button>
				<h1 className="text-lg font-bold text-dotori-900 dark:text-dotori-50">
					게시물
				</h1>
			</header>

			<div className="px-5 pt-4">
				{/* 게시물 */}
				<article className="rounded-[28px] border border-dotori-100 bg-white/90 p-5 shadow-[0_12px_24px_rgba(200,149,106,0.08)] backdrop-blur-sm dark:border-dotori-800 dark:bg-dotori-950/80 dark:shadow-none">
					<div className="flex items-start gap-3">
						<div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-dotori-100 text-sm font-bold text-dotori-600 dark:bg-dotori-800 dark:text-dotori-100">
							?
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-1.5">
								<span className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
									익명 이웃
								</span>
								{post.author.verified ? (
									<Badge color="forest" className="text-xs font-medium">
										인증
									</Badge>
								) : null}
								{post.category && categoryLabel[post.category] ? (
									<span className="rounded-full bg-dotori-50 px-2 py-0.5 text-xs font-semibold text-dotori-600 dark:bg-dotori-900 dark:text-dotori-200">
										{categoryLabel[post.category]}
									</span>
								) : null}
							</div>
							<span
								className="mt-1 block text-sm text-dotori-600 dark:text-dotori-300"
								suppressHydrationWarning
							>
								{formatRelativeTime(post.createdAt)}
							</span>
						</div>
					</div>

					<p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-dotori-800 dark:text-dotori-100">
						{post.content}
					</p>

					{post.facilityTags && post.facilityTags.length > 0 ? (
						<div className="mt-3 flex flex-wrap gap-2">
							{post.facilityTags.map((tag) => (
								<Link
									key={tag}
									href={`/explore?q=${encodeURIComponent(tag)}`}
									className="rounded-full bg-dotori-50 px-3 py-1.5 text-sm font-medium text-dotori-600 transition-colors hover:bg-dotori-100 active:scale-[0.97] dark:bg-dotori-900 dark:text-dotori-200 dark:hover:bg-dotori-800"
								>
									{tag}
								</Link>
							))}
						</div>
					) : null}

					<div className="mt-4 flex items-center gap-2 rounded-2xl bg-dotori-50/70 p-2 dark:bg-dotori-900/50">
						<button
							onClick={toggleLike}
							disabled={liking}
							className={cn(
								"flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/70 px-3 text-xs font-semibold text-dotori-700 transition-colors hover:bg-dotori-100/80 active:scale-[0.97] dark:bg-dotori-900/60 dark:text-dotori-100 dark:hover:bg-dotori-800",
								liked &&
									"bg-forest-50 text-forest-700 hover:bg-forest-100/60 dark:bg-dotori-900 dark:text-forest-200 dark:hover:bg-dotori-800",
							)}
						>
							{liked ? (
								<HeartSolidIcon className="h-5 w-5" />
							) : (
								<HeartIcon className="h-5 w-5" />
							)}
							좋아요 {post.likes}
						</button>
						<button
							onClick={() => inputRef.current?.focus()}
							className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/70 px-3 text-xs font-semibold text-dotori-700 transition-colors hover:bg-dotori-100/80 active:scale-[0.97] dark:bg-dotori-900/60 dark:text-dotori-100 dark:hover:bg-dotori-800"
						>
							<ChatBubbleLeftIcon className="h-5 w-5" />
							댓글 {post.commentCount}
						</button>
					</div>
				</article>

				{/* 댓글 */}
				<section className="mt-6">
					<div className="flex items-center justify-between">
						<h2 className="text-base font-bold text-dotori-900 dark:text-dotori-50">
							댓글 {comments.length}
						</h2>
					</div>

					{comments.length === 0 ? (
						<div className="mt-3 rounded-2xl border border-dotori-100 bg-white/80 p-5 text-center backdrop-blur-sm dark:border-dotori-800 dark:bg-dotori-950/70">
							<div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-dotori-100 text-dotori-600 dark:bg-dotori-800 dark:text-dotori-100">
								<ChatBubbleLeftIcon className="h-5 w-5" />
							</div>
							<p className="mt-3 text-sm font-semibold text-dotori-800 dark:text-dotori-100">
								아직 댓글이 없어요
							</p>
							<p className="mt-1 text-sm text-dotori-600 dark:text-dotori-300">
								첫 댓글로 따뜻한 한마디를 남겨보세요.
							</p>
							{session?.user ? (
								<Button
									color="dotori"
									type="button"
									onClick={() => inputRef.current?.focus()}
									className="mt-4 w-full min-h-11"
								>
									첫 댓글 남기기
								</Button>
							) : (
								<Button
									href="/login"
									color="dotori"
									className="mt-4 w-full min-h-11"
								>
									로그인하고 댓글 남기기
								</Button>
							)}
						</div>
					) : (
						<div className="mt-3 space-y-3">
							{comments.map((comment) => (
								<div
									key={comment.id}
									className="rounded-2xl border border-dotori-100 bg-white/80 p-4 backdrop-blur-sm dark:border-dotori-800 dark:bg-dotori-950/70"
								>
									<div className="flex gap-3">
										<div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-dotori-100 text-xs font-bold text-dotori-600 dark:bg-dotori-800 dark:text-dotori-200">
											?
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-1.5">
												<span className="text-sm font-semibold text-dotori-800 dark:text-dotori-100">
													익명 이웃
												</span>
												{comment.author.verified ? (
													<Badge color="forest" className="text-xs">
														인증
													</Badge>
												) : null}
												<span
													className="text-xs text-dotori-600 dark:text-dotori-300"
													suppressHydrationWarning
												>
													{formatRelativeTime(comment.createdAt)}
												</span>
											</div>
											<p className="mt-1 text-sm leading-relaxed text-dotori-700 dark:text-dotori-200">
												{comment.content}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			</div>

			{/* 댓글 입력 — 하단 고정 */}
			<div
				className={cn(
					"fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t border-dotori-100/50 px-5 py-3 shadow-lg dark:border-dotori-800 dark:bg-dotori-950/90",
					glass.sheet,
				)}
			>
				<div className="mx-auto flex max-w-md items-center gap-2">
					<input
						ref={inputRef}
						value={commentText}
						onChange={(e) => setCommentText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								submitComment();
							}
						}}
						placeholder={
							session?.user
								? "댓글을 입력하세요"
								: "로그인 후 댓글을 남길 수 있어요"
						}
						disabled={!session?.user}
						maxLength={2000}
						className="min-w-0 flex-1 rounded-2xl bg-dotori-50 px-4 py-3 text-sm text-dotori-900 outline-none transition-all placeholder:text-dotori-400 focus:ring-2 focus:ring-dotori-300 dark:bg-dotori-900 dark:text-dotori-50 dark:placeholder:text-dotori-600"
					/>
					<button
						onClick={submitComment}
						aria-label="댓글 보내기"
						disabled={!commentText.trim() || isSubmitting}
						className={cn(
							"shrink-0 rounded-full p-3 transition-all active:scale-[0.97]",
							commentText.trim() && !isSubmitting
								? "bg-dotori-900 text-white dark:bg-dotori-500"
								: "bg-dotori-100 text-dotori-500 dark:bg-dotori-800 dark:text-dotori-300",
						)}
					>
						<PaperAirplaneIcon className="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>
	);
}
