"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/components/dotori/facility/facility-detail-helpers";
import type {
	ActionStatus,
	ChecklistBlock as ChecklistBlockType,
	ChildProfile,
	Facility,
} from "@/types/dotori";

type UseFacilityDetailActionsParams = {
	facilityId: string;
	facilityName: string;
	facilityStatus: Facility["status"];
};

type UseFacilityDetailActionsResult = {
	sheetOpen: boolean;
	actionStatus: ActionStatus;
	sheetPreview: Record<string, string>;
	sheetPreviewForConfirm: Record<string, string>;
	liked: boolean;
	isTogglingLike: boolean;
	checklist: ChecklistBlockType | null;
	showChecklist: boolean;
	applyActionLabel: string;
	error: string | null;
	loadChecklist: () => Promise<void>;
	handleApplyClick: () => Promise<void>;
	handleConfirm: () => Promise<void>;
	toggleLike: () => Promise<void>;
	resetActionStatus: () => void;
	closeSheet: () => void;
};

type UserProfileResponse = {
	data: {
		children?: ChildProfile[];
		interests?: string[];
	};
};

type ActionIntentResponse = {
	data: {
		intentId: string;
		preview: Record<string, string>;
	};
};

type ActionExecuteResponse = {
	data: {
		success: boolean;
		data?: {
			waitlistId?: string;
			position?: number;
		};
		error?: string;
	};
};

export function useFacilityDetailActions({
	facilityId,
	facilityName,
	facilityStatus,
}: UseFacilityDetailActionsParams): UseFacilityDetailActionsResult {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
	const [intentId, setIntentId] = useState<string | null>(null);
	const [sheetPreview, setSheetPreview] = useState<Record<string, string>>({});
	const [liked, setLiked] = useState(false);
	const [isTogglingLike, setIsTogglingLike] = useState(false);
	const [userChildren, setUserChildren] = useState<ChildProfile[]>([]);
	const [checklist, setChecklist] = useState<ChecklistBlockType | null>(null);
	const [showChecklist, setShowChecklist] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { status } = useSession();
	const { addToast } = useToast();
	const router = useRouter();
	const applyActionLabel = useMemo(
		() => (facilityStatus === "available" ? "입소 신청" : "대기 신청"),
		[facilityStatus],
	);
	const fetchUserProfile = useCallback(async () => {
		const res = await apiFetch<UserProfileResponse>("/api/users/me");
		return {
			children: res.data.children ?? [],
			liked: Boolean(res.data.interests?.includes(facilityId)),
		};
	}, [facilityId]);
	const requestApplyIntent = useCallback(
		async (child?: ChildProfile) =>
			apiFetch<ActionIntentResponse>("/api/actions/intent", {
				method: "POST",
				body: JSON.stringify({
					actionType: "apply_waiting",
					params: {
						facilityId,
						childName: child?.name,
						childBirthDate: child?.birthDate,
					},
				}),
			}),
		[facilityId],
	);
	const executeApplyIntent = useCallback(
		async (currentIntentId: string) =>
			apiFetch<ActionExecuteResponse>("/api/actions/execute", {
				method: "POST",
				body: JSON.stringify({ intentId: currentIntentId }),
			}),
		[],
	);
	const syncInterest = useCallback(
		async (nextLiked: boolean) =>
			apiFetch("/api/users/me/interests", {
				method: nextLiked ? "POST" : "DELETE",
				body: JSON.stringify({ facilityId }),
			}),
		[facilityId],
	);

	useEffect(() => {
		if (status === "loading") {
			return;
		}

		if (status !== "authenticated") {
			setUserChildren([]);
			setLiked(false);
			return;
		}

		fetchUserProfile()
			.then((userProfile) => {
				setUserChildren(userProfile.children);
				setLiked(userProfile.liked);
			})
			.catch(() => {});
	}, [fetchUserProfile, status]);

	const loadChecklist = useCallback(async () => {
		if (checklist) {
			setShowChecklist((prev) => !prev);
			return;
		}

		setShowChecklist(true);
		try {
			const res = await apiFetch<{
				data: { checklist: ChecklistBlockType };
			}>(`/api/waitlist/checklist?facilityId=${facilityId}`);
			setChecklist(res.data.checklist);
		} catch {
			addToast({ type: "error", message: "체크리스트를 불러올 수 없습니다" });
			setShowChecklist(false);
		}
	}, [addToast, checklist, facilityId]);

	const handleApplyClick = useCallback(async () => {
		setActionStatus("executing");
		setSheetOpen(true);
		setError(null);
		setIntentId(null);

		try {
			const child = userChildren[0];
			const res = await requestApplyIntent(child);

			setIntentId(res.data.intentId);
			setSheetPreview(res.data.preview);
			setActionStatus("idle");
		} catch (caughtError) {
			setActionStatus("error");
			setError(
				getErrorMessage(
					caughtError,
					"대기 신청 시작에 실패했어요. 잠시 후 다시 시도해주세요",
				),
			);
			setSheetOpen(false);
		}
	}, [requestApplyIntent, userChildren]);

	const handleConfirm = useCallback(async () => {
		if (!intentId) return;
		setActionStatus("executing");
		setError(null);

		try {
			const res = await executeApplyIntent(intentId);

			if (res.data.success) {
				const position = res.data.data?.position;
				const positionLabel =
					typeof position === "number"
						? `현재 대기 ${position}번째로 신청되었어요`
						: "현재 대기 현황에서 순번을 확인할 수 있어요";

				setActionStatus("success");
				addToast({
					type: "success",
					message:
						facilityStatus === "available"
							? "입소 신청이 완료되었어요"
							: `대기 신청이 완료되었어요. ${positionLabel}`,
					action: {
						label: "MY > 대기현황 보기",
						onClick: () => router.push("/my/waitlist"),
					},
					duration: 7000,
				});
				setSheetOpen(false);
			} else {
				setActionStatus("error");
				setError(
					getErrorMessage(
						res.data.error,
						"대기 신청 처리에 실패했어요. 다시 시도해주세요",
					),
				);
				setSheetOpen(false);
			}
		} catch (caughtError) {
			setActionStatus("error");
			setError(
				getErrorMessage(caughtError, "대기 신청 처리에 실패했어요. 다시 시도해주세요"),
			);
			setSheetOpen(false);
		}
	}, [addToast, executeApplyIntent, facilityStatus, intentId, router]);

	const toggleLike = useCallback(async () => {
		if (isTogglingLike) return;
		if (status !== "authenticated") {
			addToast({
				type: "error",
				message: "관심 시설 등록은 로그인 후 이용할 수 있어요",
			});
			router.push(`/login?callbackUrl=${encodeURIComponent(`/facility/${facilityId}`)}`);
			return;
		}

		setIsTogglingLike(true);
		const nextLiked = !liked;
		setLiked(nextLiked);

		try {
			await syncInterest(nextLiked);
			addToast({
				type: "success",
				message: nextLiked ? "관심 목록에 추가했어요" : "관심 목록에서 삭제했어요",
			});
		} catch {
			setLiked(!nextLiked);
		} finally {
			setIsTogglingLike(false);
		}
	}, [addToast, facilityId, isTogglingLike, liked, router, status, syncInterest]);

	const resetActionStatus = useCallback(() => {
		setError(null);
		setActionStatus("idle");
		setIntentId(null);
	}, []);

	const closeSheet = useCallback(() => {
		setSheetOpen(false);
		setActionStatus("idle");
		setIntentId(null);
	}, []);

	const sheetPreviewForConfirm = useMemo(() => {
		if (Object.keys(sheetPreview).length > 0) {
			return sheetPreview;
		}

		return {
			시설명: facilityName,
			신청유형: applyActionLabel,
		};
	}, [applyActionLabel, facilityName, sheetPreview]);

	return {
		sheetOpen,
		actionStatus,
		sheetPreview,
		sheetPreviewForConfirm,
		liked,
		isTogglingLike,
		checklist,
		showChecklist,
		applyActionLabel,
		error,
		loadChecklist,
		handleApplyClick,
		handleConfirm,
		toggleLike,
		resetActionStatus,
		closeSheet,
	};
}
