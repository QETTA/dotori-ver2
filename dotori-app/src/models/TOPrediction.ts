import mongoose, { type Document, type Model, Schema, type Types } from "mongoose";

export interface ITOAgeClassPrediction {
	className: string;
	currentVacancy: number;
	predictedVacancy: number;
	confidence: "low" | "medium" | "high";
}

export interface ITOFactor {
	name: string;
	impact: number;
	description: string;
}

export interface ITOPrediction extends Document {
	facilityId: Types.ObjectId;
	overallScore: number;
	predictedVacancies: number;
	confidence: "low" | "medium" | "high";
	byAgeClass: ITOAgeClassPrediction[];
	factors: ITOFactor[];
	snapshotCount: number;
	calculatedAt: Date;
	validUntil: Date;
}

const TOPredictionSchema = new Schema<ITOPrediction>(
	{
		facilityId: { type: Schema.Types.ObjectId, ref: "Facility", required: true },
		overallScore: { type: Number, required: true, min: 0, max: 100 },
		predictedVacancies: { type: Number, required: true, min: 0 },
		confidence: { type: String, enum: ["low", "medium", "high"], required: true },
		byAgeClass: [
			{
				className: { type: String, required: true },
				currentVacancy: { type: Number, required: true },
				predictedVacancy: { type: Number, required: true },
				confidence: { type: String, enum: ["low", "medium", "high"], required: true },
			},
		],
		factors: [
			{
				name: { type: String, required: true },
				impact: { type: Number, required: true },
				description: { type: String, required: true },
			},
		],
		snapshotCount: { type: Number, required: true, min: 0 },
		calculatedAt: { type: Date, required: true },
		validUntil: { type: Date, required: true },
	},
	{ timestamps: true },
);

TOPredictionSchema.index({ facilityId: 1 }, { unique: true });
TOPredictionSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });
TOPredictionSchema.index({ overallScore: -1 });

const TOPrediction: Model<ITOPrediction> =
	mongoose.models.TOPrediction ||
	mongoose.model<ITOPrediction>("TOPrediction", TOPredictionSchema);
export default TOPrediction;
