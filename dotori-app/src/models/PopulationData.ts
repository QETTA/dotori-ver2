import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IPopulationData extends Document {
	regionCode: string;
	year: number;
	ageGroup: string;
	population: number;
	dataSource: "KOSIS" | "행안부";
	syncedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const PopulationDataSchema = new Schema<IPopulationData>(
	{
		regionCode: { type: String, required: true },
		year: { type: Number, required: true },
		ageGroup: { type: String, required: true },
		population: { type: Number, required: true },
		dataSource: {
			type: String,
			enum: ["KOSIS", "행안부"],
			required: true,
		},
		syncedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true },
);

PopulationDataSchema.index(
	{ regionCode: 1, year: 1, ageGroup: 1 },
	{ unique: true },
);
// Query efficiency for aggregation by source and year
PopulationDataSchema.index({ dataSource: 1, year: -1 });

const PopulationData: Model<IPopulationData> =
	mongoose.models.PopulationData ||
	mongoose.model<IPopulationData>("PopulationData", PopulationDataSchema);
export default PopulationData;
