/**
 * Notification 서비스 — 알림 영속화 + 읽음 관리 + 만료 경고 + 알림톡 발송
 *
 * Alert 트리거 → Notification 생성 → 읽음/안읽음 관리
 * 구독 만료 경고, 전자서명 만료 경고 등 시스템 알림도 여기서 처리.
 */
import mongoose from "mongoose";
import Subscription from "@/models/Subscription";
import ESignatureDocument from "@/models/ESignatureDocument";
import User from "@/models/User";
import { API_CONFIG } from "@/lib/config/api";
import { log } from "@/lib/logger";
import { auditService } from "./audit.service";
import {
	isAlimtalkConfigured,
	sendAlimtalk,
	ALIMTALK_TEMPLATES,
} from "@/lib/kakao-alimtalk";

export interface NotificationItem {
	id: string;
	type: string;
	title: string;
	message: string;
	facility?: { id: string; name: string } | null;
	read: boolean;
	createdAt: string;
}

export interface SubscriptionExpiryWarning {
	userId: string;
	plan: string;
	expiresAt: Date;
	daysRemaining: number;
}

/**
 * 곧 만료되는 구독 목록 조회 (크론용)
 * expiryWarningDays 내에 만료 예정인 active 구독
 */
export async function findExpiringSubscriptions(): Promise<
	SubscriptionExpiryWarning[]
> {
	const warningDays = API_CONFIG.SUBSCRIPTION.expiryWarningDays;
	const now = new Date();
	const warningDate = new Date();
	warningDate.setDate(warningDate.getDate() + warningDays);

	const subs = await Subscription.find({
		status: "active",
		expiresAt: { $gte: now, $lte: warningDate },
	})
		.select("userId plan expiresAt")
		.lean<
			{
				userId: mongoose.Types.ObjectId;
				plan: string;
				expiresAt: Date;
			}[]
		>();

	return subs.map((s) => ({
		userId: String(s.userId),
		plan: s.plan,
		expiresAt: s.expiresAt,
		daysRemaining: Math.ceil(
			(s.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		),
	}));
}

/**
 * 곧 만료되는 전자서명 서류 목록 조회 (크론용)
 */
export async function findExpiringDocuments(
	withinDays = 3,
): Promise<{ userId: string; docId: string; title: string; expiresAt: Date }[]> {
	const now = new Date();
	const warningDate = new Date();
	warningDate.setDate(warningDate.getDate() + withinDays);

	const docs = await ESignatureDocument.find({
		status: { $in: ["draft", "pending"] },
		expiresAt: { $gte: now, $lte: warningDate },
	})
		.select("userId title expiresAt")
		.lean<
			{
				_id: mongoose.Types.ObjectId;
				userId: mongoose.Types.ObjectId;
				title: string;
				expiresAt: Date;
			}[]
		>();

	return docs.map((d) => ({
		userId: String(d.userId),
		docId: String(d._id),
		title: d.title,
		expiresAt: d.expiresAt,
	}));
}

// --- 알림톡 발송 함수 ---

/**
 * 빈자리 알림 발송
 */
export async function sendVacancyAlert(params: {
	userId: string;
	facilityName: string;
	vacancyCount: number;
	address?: string;
}): Promise<void> {
	if (!isAlimtalkConfigured()) return;

	const user = await User.findById(params.userId)
		.select("phone alimtalkOptIn")
		.lean<{ phone?: string; alimtalkOptIn?: boolean }>();
	if (!user?.alimtalkOptIn || !user?.phone) return;

	await sendAlimtalk({
		to: user.phone,
		templateId: ALIMTALK_TEMPLATES.vacancy,
		variables: {
			facilityName: params.facilityName,
			toCount: String(params.vacancyCount),
			address: params.address || "",
		},
		userId: params.userId,
	});
}

/**
 * 만료 경고 알림 발송 (구독/서류)
 */
export async function sendExpiryWarning(params: {
	userId: string;
	type: "subscription" | "document";
	title: string;
	daysRemaining: number;
}): Promise<void> {
	if (!isAlimtalkConfigured()) return;

	const user = await User.findById(params.userId)
		.select("phone alimtalkOptIn")
		.lean<{ phone?: string; alimtalkOptIn?: boolean }>();
	if (!user?.alimtalkOptIn || !user?.phone) return;

	await sendAlimtalk({
		to: user.phone,
		templateId: ALIMTALK_TEMPLATES.subscription_expiry,
		variables: {
			title: params.title,
			type: params.type === "subscription" ? "구독" : "서류",
			daysRemaining: String(params.daysRemaining),
		},
		userId: params.userId,
	});
}

/**
 * 서명 요청 알림 발송
 */
export async function sendSignRequest(params: {
	userId: string;
	documentTitle: string;
	facilityName: string;
}): Promise<void> {
	if (!isAlimtalkConfigured()) return;

	const user = await User.findById(params.userId)
		.select("phone alimtalkOptIn")
		.lean<{ phone?: string; alimtalkOptIn?: boolean }>();
	if (!user?.alimtalkOptIn || !user?.phone) return;

	await sendAlimtalk({
		to: user.phone,
		templateId: ALIMTALK_TEMPLATES.sign_request,
		variables: {
			documentTitle: params.documentTitle,
			facilityName: params.facilityName,
		},
		userId: params.userId,
	});
}

/**
 * 구독 만료 사전경고 처리 (크론에서 호출)
 */
export async function processSubscriptionExpiryWarnings(): Promise<number> {
	const warnings = await findExpiringSubscriptions();

	for (const w of warnings) {
		// 감사 추적 기록
		void auditService.record({
			action: "subscription.expire",
			userId: w.userId,
			targetType: "subscription",
			metadata: {
				type: "expiry_warning",
				plan: w.plan,
				daysRemaining: w.daysRemaining,
				expiresAt: w.expiresAt.toISOString(),
			},
		});

		// 알림톡 실발송
		if (isAlimtalkConfigured()) {
			try {
				await sendExpiryWarning({
					userId: w.userId,
					type: "subscription",
					title: `${w.plan} 구독`,
					daysRemaining: w.daysRemaining,
				});
			} catch (err) {
				log.warn("구독 만료 알림톡 발송 실패", {
					userId: w.userId,
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}
	}

	if (warnings.length > 0) {
		log.info("구독 만료 사전경고 처리 완료", {
			count: warnings.length,
			plans: warnings.map((w) => w.plan),
		});
	}

	return warnings.length;
}

/**
 * 전자서명 만료 임박 경고 처리 (크론에서 호출)
 */
export async function processDocumentExpiryWarnings(): Promise<number> {
	const docs = await findExpiringDocuments();

	for (const d of docs) {
		void auditService.record({
			action: "esign.expire",
			userId: d.userId,
			targetType: "esignature",
			targetId: d.docId,
			metadata: {
				type: "expiry_warning",
				title: d.title,
				expiresAt: d.expiresAt.toISOString(),
			},
		});

		// 알림톡 실발송
		if (isAlimtalkConfigured()) {
			try {
				await sendExpiryWarning({
					userId: d.userId,
					type: "document",
					title: d.title,
					daysRemaining: Math.ceil(
						(d.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
					),
				});
			} catch (err) {
				log.warn("서류 만료 알림톡 발송 실패", {
					userId: d.userId,
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}
	}

	if (docs.length > 0) {
		log.info("전자서명 만료 임박 경고 처리 완료", {
			count: docs.length,
		});
	}

	return docs.length;
}

export const notificationService = {
	findExpiringSubscriptions,
	findExpiringDocuments,
	processSubscriptionExpiryWarnings,
	processDocumentExpiryWarnings,
	sendVacancyAlert,
	sendExpiryWarning,
	sendSignRequest,
};
