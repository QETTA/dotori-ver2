import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Invoice from "@/models/Invoice";
import { markInvoicePaid, voidInvoice } from "@/lib/engines/billing-engine";

const updateInvoiceSchema = z.object({
	action: z.enum(["pay", "void"]),
});

/** GET /api/billing/invoices/[id] — Invoice detail */
export const GET = withApiHandler(async (_req, { params }) => {
	const invoice = await Invoice.findById(params.id).lean();
	if (!invoice) throw new NotFoundError("청구서를 찾을 수 없습니다");
	return NextResponse.json({ data: invoice });
}, { rateLimiter: standardLimiter });

/** PATCH /api/billing/invoices/[id] — Update invoice status */
export const PATCH = withApiHandler(async (_req, { body, params }) => {
	let result;

	switch (body.action) {
		case "pay":
			result = await markInvoicePaid(params.id);
			break;
		case "void":
			result = await voidInvoice(params.id);
			break;
	}

	if (!result) throw new NotFoundError("청구서를 찾을 수 없습니다");
	return NextResponse.json({ data: result });
}, { schema: updateInvoiceSchema, rateLimiter: standardLimiter });
