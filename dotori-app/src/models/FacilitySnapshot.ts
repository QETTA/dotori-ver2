import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IFacilitySnapshot extends Document {
	facilityId: mongoose.Types.ObjectId;
	capacity: { total: number; current: number; waiting: number };
	status: "available" | "waiting" | "full";
	snapshotAt: Date;
}

const FacilitySnapshotSchema = new Schema<IFacilitySnapshot>({
	facilityId: {
		type: Schema.Types.ObjectId,
		ref: "Facility",
		required: true,
	},
	capacity: {
		total: { type: Number, required: true },
		current: { type: Number, required: true },
		waiting: { type: Number, default: 0 },
	},
	status: {
		type: String,
		enum: ["available", "waiting", "full"],
		required: true,
	},
	snapshotAt: { type: Date, default: Date.now },
});

FacilitySnapshotSchema.index({ facilityId: 1, snapshotAt: -1 });
// Auto-expire snapshots after 90 days to control collection growth
FacilitySnapshotSchema.index({ snapshotAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const FacilitySnapshot: Model<IFacilitySnapshot> =
	mongoose.models.FacilitySnapshot ||
	mongoose.model<IFacilitySnapshot>(
		"FacilitySnapshot",
		FacilitySnapshotSchema,
	);
export default FacilitySnapshot;
