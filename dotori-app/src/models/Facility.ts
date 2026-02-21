import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IFacility extends Document {
	name: string;
	type: "국공립" | "민간" | "가정" | "직장" | "협동" | "사회복지";
	status: "available" | "waiting" | "full";
	address: string;
	region: { sido: string; sigungu: string; dong: string };
	location: { type: "Point"; coordinates: [number, number] };
	phone?: string;
	capacity: { total: number; current: number; waiting: number };
	features: string[];
	programs: string[];
	rating: number;
	reviewCount: number;
	dataQuality?: {
		score?: number;
		missing?: string[];
		updatedAt?: Date;
	};
	roomCount?: number;
	teacherCount?: number;
	establishmentYear?: number;
	homepage?: string;
	evaluationGrade?: string;
	operatingHours?: { open: string; close: string; extendedCare: boolean };
	images: string[];
	kakaoPlaceUrl?: string;
	kakaoPlaceId?: string;
	dataSource: string;
	lastSyncedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const FacilitySchema = new Schema<IFacility>(
	{
		name: { type: String, required: true },
		type: {
			type: String,
			enum: ["국공립", "민간", "가정", "직장", "협동", "사회복지"],
			required: true,
		},
		status: {
			type: String,
			enum: ["available", "waiting", "full"],
			required: true,
		},
		address: { type: String, required: true },
		region: {
			sido: { type: String, required: true },
			sigungu: { type: String, required: true },
			dong: { type: String, default: "" },
		},
		location: {
			type: { type: String, enum: ["Point"], default: "Point" },
			coordinates: { type: [Number], required: true },
		},
		phone: String,
		capacity: {
			total: { type: Number, required: true },
			current: { type: Number, required: true },
			waiting: { type: Number, default: 0 },
		},
		features: { type: [String], default: [] },
		programs: { type: [String], default: [] },
		dataQuality: {
			score: { type: Number, min: 0, max: 100 },
			missing: { type: [String], default: [] },
			updatedAt: Date,
		},
		roomCount: Number,
		teacherCount: Number,
		establishmentYear: Number,
		homepage: String,
		rating: { type: Number, default: 0, min: 0, max: 5 },
		reviewCount: { type: Number, default: 0 },
		evaluationGrade: { type: String, enum: ["A", "B", "C", "D", null] },
		operatingHours: {
			open: String,
			close: String,
			extendedCare: { type: Boolean, default: false },
		},
		images: { type: [String], default: [] },
		kakaoPlaceUrl: { type: String },
		kakaoPlaceId: { type: String },
		dataSource: { type: String, default: "seed" },
		lastSyncedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true },
);

FacilitySchema.index({ location: "2dsphere" });
FacilitySchema.index({ "region.sido": 1, "region.sigungu": 1 });
FacilitySchema.index({ status: 1, type: 1 });
FacilitySchema.index({ type: 1 });
FacilitySchema.index({ name: "text", address: "text" });
FacilitySchema.index({ kakaoPlaceId: 1 }, { unique: true, sparse: true });
FacilitySchema.index({ updatedAt: 1 });
FacilitySchema.index({ lastSyncedAt: -1 });

const Facility: Model<IFacility> =
	mongoose.models.Facility ||
	mongoose.model<IFacility>("Facility", FacilitySchema);
export default Facility;
