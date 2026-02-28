import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { bundleDocuments, DOCUMENT_TYPES } from "@/lib/engines/pdf-document-engine";

const bundleSchema = z.object({
	documents: z
		.array(
			z.object({
				documentType: z.enum(DOCUMENT_TYPES),
				data: z.object({
					childName: z.string().min(1).max(100),
					parentName: z.string().min(1).max(100),
					facilityName: z.string().min(1).max(200),
					facilityAddress: z.string().max(300).optional(),
					childBirthDate: z.string().max(20).optional(),
					parentPhone: z.string().max(20).optional(),
					parentEmail: z.string().email().max(200).optional(),
					additionalInfo: z.record(z.string(), z.string()).optional(),
				}),
				signatureDataUrl: z.string().max(100_000).optional(),
			}),
		)
		.min(1)
		.max(7),
});

/** POST /api/documents/bundle — Bundle multiple documents into one PDF */
export const POST = withApiHandler(async (_req, { body }) => {
	const pdfBytes = await bundleDocuments(body.documents);
	const base64 = Buffer.from(pdfBytes).toString("base64");

	return NextResponse.json({
		data: {
			pdf: `data:application/pdf;base64,${base64}`,
			documentCount: body.documents.length,
			size: pdfBytes.length,
			generatedAt: new Date().toISOString(),
		},
	});
}, { schema: bundleSchema, rateLimiter: standardLimiter });
