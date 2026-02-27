import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { createRateLimiter } from "@/lib/rate-limit";
import { signatureSubmitSchema } from "@/lib/validations";
import { esignatureService } from "@/lib/services/esignature.service";
import { toESignatureDTO } from "@/lib/dto";
import { generateSignedPDF } from "@/lib/pdf-generator";
import User from "@/models/User";

const signLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/** POST /api/esignature/[id]/sign — 전자서명 제출 */
export const POST = withApiHandler(async (_req, { userId, body, params }) => {
	// 1. 서류 조회 + 상태 검증 (pending만 서명 가능)
	const doc = await esignatureService.findById(params.id, userId);

	if (doc.status !== "pending") {
		return NextResponse.json(
			{ error: "'pending' 상태의 서류만 서명할 수 있습니다" },
			{ status: 400 },
		);
	}

	// 2. 사용자 이름 조회
	const user = await User.findById(userId).select("name nickname").lean<{ name?: string; nickname?: string }>();
	const signerName = user?.nickname || user?.name || "서명자";

	// 3. PDF 생성
	const pdfBytes = await generateSignedPDF({
		title: doc.title,
		documentType: doc.documentType,
		signerName,
		signatureDataUrl: body.signatureData,
		facilityName: String(doc.facilityId),
		signedAt: new Date(),
	});

	// 4. PDF 저장 (현재 base64 데이터URI로 저장, 추후 S3/R2 연동)
	const base64Pdf = Buffer.from(pdfBytes).toString("base64");
	const fileUrl = `data:application/pdf;base64,${base64Pdf}`;

	// 5. 상태 전이 (pending → signed)
	const updated = await esignatureService.updateStatus(params.id, userId, "signed");

	// fileUrl 별도 업데이트
	const { default: ESignatureDocument } = await import("@/models/ESignatureDocument");
	await ESignatureDocument.findByIdAndUpdate(params.id, {
		$set: { fileUrl },
	});

	return NextResponse.json({
		data: {
			...toESignatureDTO({ ...updated, fileUrl }),
		},
	});
}, { schema: signatureSubmitSchema, rateLimiter: signLimiter });
