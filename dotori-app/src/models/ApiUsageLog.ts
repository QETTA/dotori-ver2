import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IApiUsageLog extends Document {
	partnerId: mongoose.Types.ObjectId;
	endpoint: string;
	method: string;
	statusCode: number;
	responseMs: number;
	timestamp: Date;
}

const ApiUsageLogSchema = new Schema<IApiUsageLog>(
	{
		partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
		endpoint: { type: String, required: true },
		method: { type: String, required: true, enum: ["GET", "POST", "PATCH", "DELETE", "PUT"] },
		statusCode: { type: Number, required: true },
		responseMs: { type: Number, required: true, min: 0 },
		timestamp: { type: Date, default: Date.now, required: true },
	},
	{ timestamps: false },
);

// Partner daily usage aggregation
ApiUsageLogSchema.index({ partnerId: 1, timestamp: -1 });
// Endpoint analytics
ApiUsageLogSchema.index({ endpoint: 1, timestamp: -1 });
// TTL: 90 days retention
ApiUsageLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ApiUsageLog: Model<IApiUsageLog> =
	mongoose.models.ApiUsageLog ||
	mongoose.model<IApiUsageLog>("ApiUsageLog", ApiUsageLogSchema);
export default ApiUsageLog;
