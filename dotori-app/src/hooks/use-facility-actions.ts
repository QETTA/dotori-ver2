"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/dotori/ToastProvider";

/**
 * Hook for handling facility quick-actions (관심등록, 대기신청)
 * from any listing page (explore, home, chat blocks, etc.)
 */
export function useFacilityActions() {
	const { addToast } = useToast();
	const [loadingAction, setLoadingAction] = useState<string | null>(null);

	async function registerInterest(facilityId: string) {
		setLoadingAction(`interest-${facilityId}`);
		try {
			await apiFetch("/api/users/me/interests", {
				method: "POST",
				body: JSON.stringify({ facilityId }),
			});
			addToast({ type: "success", message: "관심 목록에 추가했어요" });
		} catch {
			addToast({ type: "error", message: "관심 등록에 실패했어요" });
		} finally {
			setLoadingAction(null);
		}
	}

	async function applyWaiting(facilityId: string) {
		setLoadingAction(`waiting-${facilityId}`);
		try {
			// Create intent
			const intentRes = await apiFetch<{
				data: { intentId: string; preview: Record<string, string> };
			}>("/api/actions/intent", {
				method: "POST",
				body: JSON.stringify({
					actionType: "apply_waiting",
					params: { facilityId },
				}),
			});

			// Execute immediately (user can manage details on waitlist page)
			const execRes = await apiFetch<{
				data: { success: boolean; error?: string };
			}>("/api/actions/execute", {
				method: "POST",
				body: JSON.stringify({ intentId: intentRes.data.intentId }),
			});

			if (execRes.data.success) {
				addToast({
					type: "success",
					message: "대기 신청이 완료되었어요",
					action: { label: "확인하기", onClick: () => window.location.assign("/my/waitlist") },
				});
			} else {
				addToast({
					type: "error",
					message: execRes.data.error || "대기 신청에 실패했어요",
				});
			}
		} catch {
			addToast({ type: "error", message: "대기 신청에 실패했어요" });
		} finally {
			setLoadingAction(null);
		}
	}

	function isLoading(facilityId: string) {
		return (
			loadingAction === `interest-${facilityId}` ||
			loadingAction === `waiting-${facilityId}`
		);
	}

	return { registerInterest, applyWaiting, isLoading, loadingAction };
}
