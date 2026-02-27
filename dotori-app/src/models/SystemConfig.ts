import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ISystemConfig extends Document {
	key: string;
	value: string;
	description?: string;
	expiresAt?: Date;
	updatedAt: Date;
}

export interface ISystemConfigModel extends Model<ISystemConfig> {
	getValue(key: string): Promise<string | null>;
	setValue(key: string, value: string, description?: string): Promise<void>;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
	{
		key: { type: String, required: true, unique: true },
		value: { type: String, required: true },
		description: String,
		expiresAt: Date,
	},
	{
		timestamps: { createdAt: false, updatedAt: true },
		toJSON: {
			virtuals: true,
			transform(_doc, ret: { id?: string; _id?: unknown; __v?: unknown }) {
				ret.id = String(ret._id);
				delete ret._id;
				delete ret.__v;
			},
		},
	},
);

/**
 * 설정 값 조회 (캐시 없이 직접 DB 조회)
 */
SystemConfigSchema.statics.getValue = async function (
	key: string,
): Promise<string | null> {
	const config = await this.findOne({ key });
	return config?.value ?? null;
};

/**
 * 설정 값 저장 (upsert)
 */
SystemConfigSchema.statics.setValue = async function (
	key: string,
	value: string,
	description?: string,
): Promise<void> {
	await this.findOneAndUpdate(
		{ key },
		{ value, ...(description && { description }) },
		{ upsert: true },
	);
};

const SystemConfig: ISystemConfigModel =
	(mongoose.models.SystemConfig as ISystemConfigModel) ||
	mongoose.model<ISystemConfig, ISystemConfigModel>("SystemConfig", SystemConfigSchema);
export default SystemConfig;
