"use client";

import { Badge } from "@/components/catalyst/badge";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
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
				<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-4 backdrop-blur-xl">
					<button
						onClick={() => router.back()}
						aria-label="뒤로 가기"
						className="p-1"
					>
						<ArrowLeftIcon className="h-5 w-5" />
					</button>
					<h1 className="text-[17px] font-bold">게시물</h1>
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
				<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-4 backdrop-blur-xl">
					<button
						onClick={() => router.back()}
						aria-label="뒤로 가기"
						className="p-1"
					>
						<ArrowLeftIcon className="h-5 w-5" />
					</button>
					<h1 className="text-[17px] font-bold">게시물</h1>
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
		<div className="pb-24">
			{/* 헤더 */}
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-4 backdrop-blur-xl">
				<button
					onClick={() => router.back()}
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ArrowLeftIcon className="h-5 w-5" />
				</button>
				<h1 className="text-[17px] font-bold">게시물</h1>
			</header>

			<div className="px-5">
				{/* 게시물 본문 */}
				<article className="pt-2">
					{/* 작성자 */}
					<div className="flex items-center gap-3">
						<div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-dotori-100 text-[14px] font-bold text-dotori-600">
							?
						</div>
						<div>
							<div className="flex items-center gap-1.5">
								<span className="text-[16px] font-semibold text-dotori-900">
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
								{post.category && (
									<span className="rounded bg-dotori-50 px-1.5 py-0.5 text-[11px] font-medium text-dotori-500">
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

					{/* 본문 */}
					<p className="mt-4 whitespace-pre-wrap text-[16px] leading-relaxed text-dotori-800">
						{post.content}
					</p>

					{/* 시설 태그 */}
					{post.facilityTags && post.facilityTags.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-2">
							{post.facilityTags.map((tag) => (
								<Link
									key={tag}
									href={`/explore?q=${encodeURIComponent(tag)}`}
									className="rounded-full bg-dotori-50 px-3 py-1.5 text-[13px] font-medium text-dotori-600 transition-colors hover:bg-dotori-100"
								>
									{tag}
								</Link>
							))}
						</div>
					)}

					{/* 액션 바 */}
					<div className="mt-4 flex items-center gap-4 border-b border-dotori-100/40 pb-4 text-[14px] text-dotori-500">
						<button
							onClick={toggleLike}
							disabled={liking}
							className={cn(
								"flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors active:scale-[0.97]",
								liked
									? "text-red-500 hover:bg-red-50"
									: "hover:bg-dotori-50 hover:text-dotori-600",
							)}
						>
							{liked ? (
								<HeartSolidIcon className="h-5 w-5" />
							) : (
								<HeartIcon className="h-5 w-5" />
							)}
							{post.likes}
						</button>
						<button
							onClick={() => inputRef.current?.focus()}
							className="flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors hover:bg-dotori-50 hover:text-dotori-600 active:scale-[0.97]"
						>
							<ChatBubbleLeftIcon className="h-5 w-5" />
							{post.commentCount}
						</button>
					</div>
				</article>

				{/* 댓글 목록 */}
				<section className="mt-4">
					<h2 className="text-[15px] font-bold text-dotori-900">
						댓글 {comments.length}
					</h2>
					{comments.length === 0 ? (
						<p className="mt-4 text-center text-[14px] text-dotori-500">
							첫 댓글을 남겨보세요
						</p>
					) : (
						<div className="mt-3 space-y-4">
								{comments.map((comment) => (
									<div key={comment.id} className="flex gap-3">
										<div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-dotori-100 text-[12px] font-bold text-dotori-500">
											?
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												<span className="text-[14px] font-semibold text-dotori-800">
													익명 이웃
												</span>
											{comment.author.verified && (
												<Badge
													color="forest"
													className="text-[10px]"
												>
													인증
												</Badge>
											)}
											<span
												className="text-[12px] text-dotori-500"
												suppressHydrationWarning
											>
												{formatRelativeTime(
													comment.createdAt,
												)}
											</span>
										</div>
										<p className="mt-1 text-[14px] leading-relaxed text-dotori-700">
											{comment.content}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			</div>

			{/* 댓글 입력 — 하단 고정 */}
			<div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t border-dotori-100/40 bg-white/95 px-5 py-3 backdrop-blur-sm">
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
						className="min-w-0 flex-1 rounded-2xl bg-dotori-50 px-4 py-3 text-[14px] outline-none transition-all placeholder:text-dotori-500 focus:ring-2 focus:ring-dotori-300"
					/>
					<button
						onClick={submitComment}
						aria-label="댓글 보내기"
						disabled={!commentText.trim() || isSubmitting}
						className={cn(
							"shrink-0 rounded-full p-3 transition-all active:scale-[0.97]",
							commentText.trim() && !isSubmitting
								? "bg-dotori-900 text-white"
								: "bg-dotori-100 text-dotori-500",
						)}
					>
						<PaperAirplaneIcon className="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>
	);
}
