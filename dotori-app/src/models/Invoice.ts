import mongoose, { type Document, type Model, Schema } from "mongoose";

const INVOICE_STATUSES = ["draft", "issued", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface IInvoiceItem {
	description: string;
	amount: number;
	quantity: number;
}

export interface IInvoice extends Document {
	subscriptionId: mongoose.Types.ObjectId;
	partnerId: mongoose.Types.ObjectId;
	amount: number;
	currency: string;
	status: InvoiceStatus;
	items: IInvoiceItem[];
	issuedAt?: Date;
	paidAt?: Date;
	dueDate: Date;
	createdAt: Date;
	updatedAt: Date;
}

const InvoiceItemSchema = new Schema(
	{
		description: { type: String, required: true },
		amount: { type: Number, required: true, min: 0 },
		quantity: { type: Number, required: true, min: 1, default: 1 },
	},
	{ _id: false },
);

const InvoiceSchema = new Schema<IInvoice>(
	{
		subscriptionId: { type: Schema.Types.ObjectId, ref: "BillingSubscription", required: true },
		partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
		amount: { type: Number, required: true, min: 0 },
		currency: { type: String, default: "KRW", required: true },
		status: { type: String, enum: INVOICE_STATUSES, default: "draft", required: true },
		items: { type: [InvoiceItemSchema], default: [] },
		issuedAt: Date,
		paidAt: Date,
		dueDate: { type: Date, required: true },
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform(_doc, ret: Record<string, unknown>) {
				ret.id = String(ret._id);
				delete ret._id;
				delete ret.__v;
			},
		},
	},
);

InvoiceSchema.index({ partnerId: 1, status: 1 });
InvoiceSchema.index({ subscriptionId: 1, createdAt: -1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });

const Invoice: Model<IInvoice> =
	mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
export default Invoice;
