import mongoose, { type Document, type Model, Schema, type Types } from "mongoose";
import { API_CONFIG } from "@/lib/config/api";

const EVENT_TYPES = [
	"visit_request",
	"waitlist_apply",
	"interest_add",
	"esign_complete",
] as const;

export type CPAEventType = (typeof EVENT_TYPES)[number];

export interface ICPAEvent extends Document {
	eventType: CPAEventType;
	userId: Types.ObjectId;
	facilityId: Types.ObjectId;
	targetId: Types.ObjectId;
	metadata?: Record<string, unknown>;
	occurredAt: Date;
}

const CPAEventSchema = new Schema<ICPAEvent>(
	{
		eventType: { type: String, enum: EVENT_TYPES, required: true },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		facilityId: { type: Schema.Types.ObjectId, ref: "Facility", required: true },
		targetId: { type: Schema.Types.ObjectId, required: true },
		metadata: { type: Schema.Types.Mixed },
		occurredAt: { type: Date, default: Date.now, required: true },
	},
	{ timestamps: false },
);

// 시설별 이벤트 타입별 조회 (통계 집계)
CPAEventSchema.index({ facilityId: 1, eventType: 1, occurredAt: -1 });
// 사용자별 이벤트 이력
CPAEventSchema.index({ userId: 1, occurredAt: -1 });
// TTL: 2년 보관
CPAEventSchema.index(
	{ occurredAt: 1 },
	{ expireAfterSeconds: API_CONFIG.CPA.retentionDays * 24 * 60 * 60 },
);

const CPAEvent: Model<ICPAEvent> =
	mongoose.models.CPAEvent ||
	mongoose.model<ICPAEvent>("CPAEvent", CPAEventSchema);
export default CPAEvent;
