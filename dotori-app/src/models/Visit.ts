import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IVisit extends Document {
	userId: mongoose.Types.ObjectId;
	facilityId: mongoose.Types.ObjectId;
	childId?: mongoose.Types.ObjectId;
	status: "requested" | "confirmed" | "completed" | "cancelled";
	scheduledAt: Date;
	notes?: string;
	confirmedAt?: Date;
	cancelReason?: string;
	createdAt: Date;
	updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		facilityId: {
			type: Schema.Types.ObjectId,
			ref: "Facility",
			required: true,
		},
		childId: { type: Schema.Types.ObjectId },
		status: {
			type: String,
			enum: ["requested", "confirmed", "completed", "cancelled"],
			default: "requested",
		},
		scheduledAt: { type: Date, required: true },
		notes: { type: String, maxlength: 500 },
		confirmedAt: Date,
		cancelReason: { type: String, maxlength: 200 },
	},
	{ timestamps: true },
);

// Prevent double-booking: one active visit per user-facility pair
VisitSchema.index(
	{ userId: 1, facilityId: 1 },
	{
		unique: true,
		partialFilterExpression: { status: { $in: ["requested", "confirmed"] } },
	},
);
VisitSchema.index({ facilityId: 1, status: 1 });
VisitSchema.index({ userId: 1, status: 1, scheduledAt: -1 });

const Visit: Model<IVisit> =
	mongoose.models.Visit ||
	mongoose.model<IVisit>("Visit", VisitSchema);
export default Visit;
