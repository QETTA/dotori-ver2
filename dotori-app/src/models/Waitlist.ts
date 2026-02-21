import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IWaitlist extends Document {
	userId: mongoose.Types.ObjectId;
	facilityId: mongoose.Types.ObjectId;
	childName: string;
	childBirthDate: string;
	status: "pending" | "confirmed" | "cancelled";
	position?: number;
	ageClass?: string; // 연령반 (만0세반~만5세반)
	externalRef?: string; // 아이사랑 접수번호
	requiredDocs: {
		docId: string;
		name: string;
		submitted: boolean;
		submittedAt?: Date;
	}[];
	lastSyncedAt?: Date; // 아이사랑 대기현황 마지막 동기화
	appliedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		facilityId: {
			type: Schema.Types.ObjectId,
			ref: "Facility",
			required: true,
		},
		childName: { type: String, required: true },
		childBirthDate: { type: String, required: true },
		status: {
			type: String,
			enum: ["pending", "confirmed", "cancelled"],
			default: "pending",
		},
		position: Number,
		ageClass: String,
		externalRef: String,
		requiredDocs: {
			type: [
				{
					docId: { type: String, required: true },
					name: { type: String, required: true },
					submitted: { type: Boolean, default: false },
					submittedAt: Date,
				},
			],
			default: [],
		},
		lastSyncedAt: Date,
		appliedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true },
);

WaitlistSchema.index({ userId: 1, facilityId: 1 }, { unique: true });
WaitlistSchema.index({ facilityId: 1, status: 1 });
WaitlistSchema.index({ externalRef: 1 }, { unique: true, sparse: true });
WaitlistSchema.index({ userId: 1, status: 1 });
WaitlistSchema.index({ userId: 1, status: 1, appliedAt: -1 });

const Waitlist: Model<IWaitlist> =
	mongoose.models.Waitlist ||
	mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);
export default Waitlist;
