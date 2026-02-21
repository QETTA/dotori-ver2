import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IUser extends Document {
	name: string;
	email?: string;
	emailVerified?: Date;
	image?: string;
	nickname: string;
	phone?: string;
	alimtalkOptIn: boolean;
	children: {
		name: string;
		birthDate: string;
		gender: "male" | "female" | "unspecified";
		specialNeeds?: string[];
	}[];
	region: {
		sido: string;
		sigungu: string;
		dong?: string;
	};
	preferences: {
		facilityTypes: string[];
		features: string[];
	};
	interests: mongoose.Types.ObjectId[];
	gpsVerified: boolean;
	plan: "free" | "premium";
	onboardingCompleted: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const ChildSchema = new Schema(
	{
		name: { type: String, required: true },
		birthDate: { type: String, required: true },
		gender: {
			type: String,
			enum: ["male", "female", "unspecified"],
			default: "unspecified",
		},
		specialNeeds: [String],
	},
	{
		_id: true,
		toJSON: {
			virtuals: true,
			transform(_doc, ret: Record<string, unknown>) {
				ret.id = String(ret._id);
				delete ret._id;
			},
		},
	},
);

const RegionSchema = new Schema(
	{
		sido: { type: String, default: "" },
		sigungu: { type: String, default: "" },
		dong: { type: String, default: "" },
	},
	{ _id: false },
);

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true },
		email: { type: String },
		emailVerified: Date,
		image: String,
		nickname: { type: String, default: "" },
		phone: { type: String },
		alimtalkOptIn: { type: Boolean, default: false },
		children: { type: [ChildSchema], default: [] },
		region: { type: RegionSchema, default: () => ({}) },
		preferences: {
			type: {
				facilityTypes: { type: [String], default: [] },
				features: { type: [String], default: [] },
			},
			default: () => ({ facilityTypes: [], features: [] }),
		},
		interests: [{ type: Schema.Types.ObjectId, ref: "Facility" }],
		gpsVerified: { type: Boolean, default: false },
		plan: { type: String, enum: ["free", "premium"], default: "free" },
		onboardingCompleted: { type: Boolean, default: false },
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform(_doc, ret: { id?: string; _id?: unknown; __v?: unknown; interests?: unknown[] }) {
				ret.id = String(ret._id);
				delete ret._id;
				delete ret.__v;
				if (ret.interests) {
					ret.interests = ret.interests.map(String);
				}
			},
		},
	},
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });

const User: Model<IUser> =
	mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
