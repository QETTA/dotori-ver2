import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IReview extends Document {
	userId: mongoose.Types.ObjectId;
	facilityId: mongoose.Types.ObjectId;
	rating: number;
	content: string;
	images: string[];
	verified: boolean;
	helpful: mongoose.Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		facilityId: {
			type: Schema.Types.ObjectId,
			ref: "Facility",
			required: true,
		},
		rating: { type: Number, required: true, min: 1, max: 5 },
		content: { type: String, required: true },
		images: { type: [String], default: [] },
		verified: { type: Boolean, default: false },
		helpful: [{ type: Schema.Types.ObjectId, ref: "User" }],
	},
	{ timestamps: true },
);

ReviewSchema.index({ facilityId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, facilityId: 1 }, { unique: true });
ReviewSchema.index({ facilityId: 1, rating: 1 });

const Review: Model<IReview> =
	mongoose.models.Review ||
	mongoose.model<IReview>("Review", ReviewSchema);
export default Review;
