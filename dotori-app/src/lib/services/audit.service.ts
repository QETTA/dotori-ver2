/**
 * Audit trail 서비스 — 감사 추적 로그 기록 + 조회
 *
 * 전자서명 법적 요건: 모든 서명/상태변경 이벤트를 불변 기록으로 저장.
 * fire-and-forget 패턴: 감사 로그 실패가 비즈니스 로직을 차단하면 안 됨.
 */
import mongoose from "mongoose";
import AuditLog, { type AuditAction, type IAuditLog } from "@/models/AuditLog";
import { log } from "@/lib/logger";

export interface AuditEntry {
	action: AuditAction;
	userId?: string;
	targetType: IAuditLog["targetType"];
	targetId?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
}

export interface AuditTrailQuery {
	targetType: IAuditLog["targetType"];
	targetId: string;
	limit?: number;
}

export interface AuditTrailResult {
	action: AuditAction;
	userId?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
	timestamp: string;
}

/**
 * 감사 로그 기록 (fire-and-forget)
 * 실패해도 비즈니스 로직에 영향 없음
 */
export async function record(entry: AuditEntry): Promise<void> {
	try {
		await AuditLog.create({
			action: entry.action,
			userId: entry.userId
				? new mongoose.Types.ObjectId(entry.userId)
				: undefined,
			targetType: entry.targetType,
			targetId: entry.targetId
				? new mongoose.Types.ObjectId(entry.targetId)
				: undefined,
			metadata: entry.metadata,
			ipAddress: entry.ipAddress,
			userAgent: entry.userAgent,
			timestamp: new Date(),
		});
	} catch (err) {
		// 감사 로그 실패는 경고만 — 비즈니스 차단 금지
		log.warn("감사 로그 기록 실패", {
			action: entry.action,
			error: err instanceof Error ? err.message : String(err),
		});
	}
}

/**
 * 특정 문서의 감사 추적 이력 조회
 * 감사추적인증서(Audit Trail Certificate) 생성 시 사용
 */
export async function getTrail(
	query: AuditTrailQuery,
): Promise<AuditTrailResult[]> {
	if (!mongoose.Types.ObjectId.isValid(query.targetId)) {
		return [];
	}

	const limit = Math.min(query.limit ?? 100, 500);

	const logs = await AuditLog.find({
		targetType: query.targetType,
		targetId: query.targetId,
	})
		.sort({ timestamp: 1 })
		.limit(limit)
		.lean<
			{
				action: AuditAction;
				userId?: mongoose.Types.ObjectId;
				metadata?: Record<string, unknown>;
				ipAddress?: string;
				timestamp: Date;
			}[]
		>();

	return logs.map((l) => ({
		action: l.action,
		userId: l.userId ? String(l.userId) : undefined,
		metadata: l.metadata,
		ipAddress: l.ipAddress,
		timestamp: l.timestamp.toISOString(),
	}));
}

/**
 * 사용자 활동 이력 조회
 */
export async function getUserActivity(
	userId: string,
	limit = 50,
): Promise<AuditTrailResult[]> {
	if (!mongoose.Types.ObjectId.isValid(userId)) {
		return [];
	}

	const logs = await AuditLog.find({ userId })
		.sort({ timestamp: -1 })
		.limit(Math.min(limit, 200))
		.lean<
			{
				action: AuditAction;
				userId?: mongoose.Types.ObjectId;
				metadata?: Record<string, unknown>;
				ipAddress?: string;
				timestamp: Date;
			}[]
		>();

	return logs.map((l) => ({
		action: l.action,
		userId: l.userId ? String(l.userId) : undefined,
		metadata: l.metadata,
		ipAddress: l.ipAddress,
		timestamp: l.timestamp.toISOString(),
	}));
}

export const auditService = {
	record,
	getTrail,
	getUserActivity,
};
