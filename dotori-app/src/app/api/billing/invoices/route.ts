import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { getPartnerInvoices } from "@/lib/engines/billing-engine";

/** GET /api/billing/invoices — List invoices */
export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const partnerId = searchParams.get("partnerId");

	if (!partnerId) {
		return NextResponse.json(
			{ error: "partnerId query parameter is required" },
			{ status: 400 },
		);
	}

	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

	const result = await getPartnerInvoices(partnerId, { page, limit });

	return NextResponse.json({
		data: result.data,
		pagination: {
			page,
			limit,
			total: result.total,
			totalPages: Math.ceil(result.total / limit),
		},
	});
}, { rateLimiter: relaxedLimiter });
