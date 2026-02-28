import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { generateAuditCertificate } from "@/lib/engines/pdf-document-engine";

/** GET /api/documents/[id]/audit-certificate — Generate audit trail certificate */
export const GET = withApiHandler(async (_req, { params }) => {
	const pdfBytes = await generateAuditCertificate(params.id);
	const base64 = Buffer.from(pdfBytes).toString("base64");

	return NextResponse.json({
		data: {
			pdf: `data:application/pdf;base64,${base64}`,
			documentId: params.id,
			size: pdfBytes.length,
			generatedAt: new Date().toISOString(),
		},
	});
}, { rateLimiter: standardLimiter });
