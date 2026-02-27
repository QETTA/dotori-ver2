import mongoose, { type Document, type Model, Schema } from "mongoose";

/**
 * 감사 추적 로그 — 전자서명 법적 요건 (전자문서법 제4조)
 *
 * 모든 전자서명 관련 이벤트를 불변 기록으로 저장.
 * 감사추적인증서 생성 시 이 데이터를 기반으로 PDF 출력.
 */

export const AUDIT_ACTIONS = [
	"esign.create",
	"esign.status_change",
	"esign.sign",
	"esign.submit",
	"esign.delete",
	"esign.expire",
	"esign.view",
	"subscription.create",
	"subscription.cancel",
	"subscription.expire",
	"alert.create",
	"alert.delete",
	"alert.channels_update",
	"waitlist.apply",
	"waitlist.cancel",
	"visit.create",
	"visit.confirmed",
	"visit.completed",
	"visit.cancel",
	"review.create",
	"review.update",
	"review.delete",
	"user.login",
	"user.profile_update",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface IAuditLog extends Document {
	action: AuditAction;
	userId?: mongoose.Types.ObjectId;
	targetType: "esignature" | "subscription" | "alert" | "waitlist" | "visit" | "review" | "user" | "facility";
	targetId?: mongoose.Types.ObjectId;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
	timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
	{
		action: {
			type: String,
			enum: AUDIT_ACTIONS,
			required: true,
			index: true,
		},
		userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
		targetType: {
			type: String,
			enum: ["esignature", "subscription", "alert", "waitlist", "visit", "review", "user", "facility"],
			required: true,
		},
		targetId: { type: Schema.Types.ObjectId, index: true },
		metadata: { type: Schema.Types.Mixed },
		ipAddress: String,
		userAgent: String,
		timestamp: { type: Date, default: Date.now, required: true },
	},
	{
		// 감사 로그는 불변 — updatedAt 불필요
		timestamps: false,
		// 쓰기 최적화
		writeConcern: { w: 1, j: true },
	},
);

// 복합 인덱스: 특정 문서의 전체 이력 조회
AuditLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
// 사용자별 활동 이력
AuditLogSchema.index({ userId: 1, timestamp: -1 });
// TTL: 5년 보관 (전자문서법 보존 기간)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 5 * 365 * 24 * 60 * 60 });

const AuditLog: Model<IAuditLog> =
	mongoose.models.AuditLog ||
	mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
