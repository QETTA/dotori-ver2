/**
 * PDF Document Engine
 *
 * 7종 입소 서류 PDF 생성 + 번들링 + 감사추적인증서.
 * Uses pdf-lib (pure JS, no native deps).
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import AuditLog from "@/models/AuditLog";

/* ─── Document Types ─── */

export const DOCUMENT_TYPES = [
	"입소신청서",
	"예방접종증명서",
	"건강검진결과서",
	"보육교육정보동의서",
	"이용계약서",
	"긴급연락처귀가동의서",
	"알레르기특이사항고지서",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface DocumentGenerateParams {
	documentType: DocumentType;
	data: {
		childName: string;
		parentName: string;
		facilityName: string;
		facilityAddress?: string;
		childBirthDate?: string;
		parentPhone?: string;
		parentEmail?: string;
		additionalInfo?: Record<string, string>;
	};
	signatureDataUrl?: string;
}

/* ─── Single Document Generation ─── */

export async function generateDocument(
	params: DocumentGenerateParams,
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const page = pdfDoc.addPage([595.28, 841.89]); // A4
	const { width, height } = page.getSize();
	const margin = 50;
	let yPos = height - margin;

	// Title
	const title = getDocumentTitle(params.documentType);
	page.drawText(title, {
		x: margin,
		y: yPos,
		size: 18,
		font: boldFont,
		color: rgb(0.18, 0.18, 0.18),
	});
	yPos -= 40;

	// Dotori branding line
	page.drawText("Dotori - Document Service", {
		x: margin,
		y: yPos,
		size: 10,
		font,
		color: rgb(0.69, 0.58, 0.42), // dotori color
	});
	yPos -= 30;

	// Horizontal rule
	page.drawLine({
		start: { x: margin, y: yPos },
		end: { x: width - margin, y: yPos },
		thickness: 1,
		color: rgb(0.85, 0.85, 0.85),
	});
	yPos -= 25;

	// Document fields
	const fields = getDocumentFields(params);
	for (const [label, value] of fields) {
		page.drawText(`${label}:`, {
			x: margin,
			y: yPos,
			size: 11,
			font: boldFont,
			color: rgb(0.3, 0.3, 0.3),
		});
		page.drawText(value, {
			x: margin + 150,
			y: yPos,
			size: 11,
			font,
			color: rgb(0.15, 0.15, 0.15),
		});
		yPos -= 22;
	}

	yPos -= 20;

	// Signature placeholder
	if (params.signatureDataUrl) {
		try {
			const sigBytes = extractBase64Bytes(params.signatureDataUrl);
			if (sigBytes) {
				const sigImage = params.signatureDataUrl.includes("image/png")
					? await pdfDoc.embedPng(sigBytes)
					: await pdfDoc.embedJpg(sigBytes);
				const sigDims = sigImage.scale(0.3);
				page.drawImage(sigImage, {
					x: margin,
					y: yPos - sigDims.height,
					width: sigDims.width,
					height: sigDims.height,
				});
				yPos -= sigDims.height + 10;
			}
		} catch {
			// Signature embed failed — continue without
		}
	}

	// Footer
	const dateStr = new Date().toISOString().slice(0, 10);
	page.drawText(`Generated: ${dateStr}`, {
		x: margin,
		y: margin,
		size: 8,
		font,
		color: rgb(0.6, 0.6, 0.6),
	});

	return pdfDoc.save();
}

/* ─── Bundle Multiple Documents ─── */

export async function bundleDocuments(
	documents: DocumentGenerateParams[],
): Promise<Uint8Array> {
	const mergedPdf = await PDFDocument.create();

	for (const docParams of documents) {
		const pdfBytes = await generateDocument(docParams);
		const singlePdf = await PDFDocument.load(pdfBytes);
		const pages = await mergedPdf.copyPages(singlePdf, singlePdf.getPageIndices());
		for (const page of pages) {
			mergedPdf.addPage(page);
		}
	}

	return mergedPdf.save();
}

/* ─── Audit Certificate ─── */

export async function generateAuditCertificate(
	documentId: string,
): Promise<Uint8Array> {
	// Fetch audit trail
	const auditLogs = await AuditLog.find({
		targetType: "esignature",
		targetId: documentId,
	})
		.sort({ timestamp: 1 })
		.lean<{ action: string; userId?: unknown; timestamp: Date; ipAddress?: string; metadata?: Record<string, unknown> }[]>();

	const pdfDoc = await PDFDocument.create();
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const page = pdfDoc.addPage([595.28, 841.89]);
	const { width, height } = page.getSize();
	const margin = 50;
	let yPos = height - margin;

	// Title
	page.drawText("Audit Trail Certificate", {
		x: margin,
		y: yPos,
		size: 18,
		font: boldFont,
		color: rgb(0.18, 0.18, 0.18),
	});
	yPos -= 30;

	page.drawText(`Document ID: ${documentId}`, {
		x: margin,
		y: yPos,
		size: 10,
		font,
		color: rgb(0.4, 0.4, 0.4),
	});
	yPos -= 15;

	page.drawText(`Generated: ${new Date().toISOString()}`, {
		x: margin,
		y: yPos,
		size: 10,
		font,
		color: rgb(0.4, 0.4, 0.4),
	});
	yPos -= 30;

	// Horizontal rule
	page.drawLine({
		start: { x: margin, y: yPos },
		end: { x: width - margin, y: yPos },
		thickness: 1,
		color: rgb(0.85, 0.85, 0.85),
	});
	yPos -= 25;

	// Audit events
	if (auditLogs.length === 0) {
		page.drawText("No audit events found.", {
			x: margin,
			y: yPos,
			size: 11,
			font,
			color: rgb(0.5, 0.5, 0.5),
		});
	} else {
		for (const log of auditLogs) {
			if (yPos < margin + 40) break; // Prevent overflow

			const timestamp = new Date(log.timestamp).toISOString();
			page.drawText(`[${timestamp}]`, {
				x: margin,
				y: yPos,
				size: 9,
				font,
				color: rgb(0.5, 0.5, 0.5),
			});
			yPos -= 15;

			page.drawText(`Action: ${log.action}`, {
				x: margin + 10,
				y: yPos,
				size: 10,
				font: boldFont,
				color: rgb(0.2, 0.2, 0.2),
			});

			if (log.ipAddress) {
				page.drawText(`IP: ${log.ipAddress}`, {
					x: margin + 250,
					y: yPos,
					size: 9,
					font,
					color: rgb(0.5, 0.5, 0.5),
				});
			}
			yPos -= 20;
		}
	}

	// Footer
	page.drawText("This certificate is auto-generated. Dotori Inc.", {
		x: margin,
		y: margin,
		size: 8,
		font,
		color: rgb(0.6, 0.6, 0.6),
	});

	return pdfDoc.save();
}

/* ─── Helpers ─── */

function getDocumentTitle(type: DocumentType): string {
	const titles: Record<DocumentType, string> = {
		"입소신청서": "Admission Application",
		"예방접종증명서": "Vaccination Certificate",
		"건강검진결과서": "Health Examination Report",
		"보육교육정보동의서": "Childcare/Education Info Consent",
		"이용계약서": "Service Agreement",
		"긴급연락처귀가동의서": "Emergency Contact & Pickup Consent",
		"알레르기특이사항고지서": "Allergy & Special Conditions Notice",
	};
	return titles[type];
}

function getDocumentFields(
	params: DocumentGenerateParams,
): [string, string][] {
	const { data } = params;
	const fields: [string, string][] = [
		["Child Name", data.childName],
		["Parent Name", data.parentName],
		["Facility", data.facilityName],
	];

	if (data.facilityAddress) fields.push(["Address", data.facilityAddress]);
	if (data.childBirthDate) fields.push(["Birth Date", data.childBirthDate]);
	if (data.parentPhone) fields.push(["Phone", data.parentPhone]);
	if (data.parentEmail) fields.push(["Email", data.parentEmail]);

	if (data.additionalInfo) {
		for (const [key, value] of Object.entries(data.additionalInfo)) {
			fields.push([key, value]);
		}
	}

	return fields;
}

function extractBase64Bytes(dataUrl: string): Uint8Array | null {
	const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
	if (!match?.[1]) return null;
	try {
		const binary = atob(match[1]);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch {
		return null;
	}
}
