import mongoose, { type Document, type Model, Schema, type Types } from "mongoose";

const DOCUMENT_TYPES = [
	// 기존 서류 (enrollment)
	"입소신청서",
	"건강검진확인서",
	"예방접종증명서",
	"영유아건강검진결과통보서",
	"주민등록등본",
	"재직증명서",
	"소득증빙서류",
	// 동의서 (consent) — 전략 v4.0
	"입소동의서",
	"개인정보동의서",
	"귀가동의서",
	"투약의뢰서",
	"현장학습동의서",
	"차량운행동의서",
	"CCTV열람동의서",
] as const;

const STATUSES = ["draft", "pending", "signed", "submitted", "expired"] as const;

export interface IESignatureDocument extends Document {
	userId: Types.ObjectId;
	facilityId: Types.ObjectId;
	documentType: (typeof DOCUMENT_TYPES)[number];
	status: (typeof STATUSES)[number];
	title: string;
	fileUrl?: string;
	signedAt?: Date;
	expiresAt?: Date;
	metadata?: Record<string, unknown>;
}

const ESignatureDocumentSchema = new Schema<IESignatureDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		facilityId: { type: Schema.Types.ObjectId, ref: "Facility", required: true },
		documentType: { type: String, enum: DOCUMENT_TYPES, required: true },
		status: { type: String, enum: STATUSES, default: "draft" },
		title: { type: String, required: true },
		fileUrl: String,
		signedAt: Date,
		expiresAt: Date,
		metadata: { type: Schema.Types.Mixed },
	},
	{ timestamps: true },
);

ESignatureDocumentSchema.index({ userId: 1, status: 1 });
ESignatureDocumentSchema.index({ facilityId: 1, userId: 1 });
ESignatureDocumentSchema.index({ userId: 1, documentType: 1 });
ESignatureDocumentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7776000 }); // TTL 90일 (만료 후 정리)

const ESignatureDocument: Model<IESignatureDocument> =
	mongoose.models.ESignatureDocument ||
	mongoose.model<IESignatureDocument>("ESignatureDocument", ESignatureDocumentSchema);
export default ESignatureDocument;
