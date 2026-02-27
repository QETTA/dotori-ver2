/**
 * PDF 서명 문서 생성 유틸리티
 *
 * pdf-lib를 사용하여 서명된 PDF 문서를 생성.
 * 순수 유틸 함수 (DB 무관).
 */

export interface GenerateSignedPDFInput {
	title: string;
	documentType: string;
	signerName: string;
	signatureDataUrl: string;
	facilityName: string;
	signedAt: Date;
}

/**
 * 서명된 PDF 문서 생성
 *
 * @returns Uint8Array (PDF 바이너리)
 */
export async function generateSignedPDF(
	input: GenerateSignedPDFInput,
): Promise<Uint8Array> {
	const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([595.28, 841.89]); // A4

	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const { width, height } = page.getSize();
	const margin = 50;
	let y = height - margin;

	// Title
	page.drawText(input.title, {
		x: margin,
		y,
		size: 18,
		font: boldFont,
		color: rgb(0.1, 0.1, 0.1),
	});
	y -= 30;

	// Document type
	page.drawText(`Document Type: ${input.documentType}`, {
		x: margin,
		y,
		size: 12,
		font,
		color: rgb(0.3, 0.3, 0.3),
	});
	y -= 25;

	// Facility name
	page.drawText(`Facility: ${input.facilityName}`, {
		x: margin,
		y,
		size: 12,
		font,
		color: rgb(0.3, 0.3, 0.3),
	});
	y -= 25;

	// Signer name
	page.drawText(`Signer: ${input.signerName}`, {
		x: margin,
		y,
		size: 12,
		font,
		color: rgb(0.3, 0.3, 0.3),
	});
	y -= 25;

	// Signed at
	page.drawText(`Signed: ${input.signedAt.toISOString()}`, {
		x: margin,
		y,
		size: 12,
		font,
		color: rgb(0.3, 0.3, 0.3),
	});
	y -= 40;

	// Divider line
	page.drawLine({
		start: { x: margin, y },
		end: { x: width - margin, y },
		thickness: 1,
		color: rgb(0.7, 0.7, 0.7),
	});
	y -= 30;

	// Signature section
	page.drawText("Signature:", {
		x: margin,
		y,
		size: 14,
		font: boldFont,
		color: rgb(0.1, 0.1, 0.1),
	});
	y -= 20;

	// Embed signature image if valid data URL
	if (input.signatureDataUrl && input.signatureDataUrl.startsWith("data:image/png")) {
		try {
			const base64Data = input.signatureDataUrl.split(",")[1];
			if (base64Data) {
				const sigBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
				const sigImage = await pdfDoc.embedPng(sigBytes);
				const sigDims = sigImage.scale(0.5);
				const maxWidth = width - 2 * margin;
				const scale = sigDims.width > maxWidth ? maxWidth / sigDims.width : 1;

				page.drawImage(sigImage, {
					x: margin,
					y: y - sigDims.height * scale,
					width: sigDims.width * scale,
					height: sigDims.height * scale,
				});
				y -= sigDims.height * scale + 20;
			}
		} catch {
			// Signature image embedding failed, add text fallback
			page.drawText("[Signature image could not be embedded]", {
				x: margin,
				y,
				size: 10,
				font,
				color: rgb(0.5, 0.5, 0.5),
			});
			y -= 20;
		}
	}

	// Footer
	const footerY = margin;
	page.drawText(
		"This document was electronically signed via Dotori.",
		{
			x: margin,
			y: footerY,
			size: 8,
			font,
			color: rgb(0.5, 0.5, 0.5),
		},
	);

	return pdfDoc.save();
}
