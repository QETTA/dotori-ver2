/**
 * 전자서명 동의서·서류 템플릿 정의
 *
 * 전략 v4.0: 풀퍼널 10분 완결을 위한 7종 동의서(consent) + 7종 서류(enrollment)
 */

export interface TemplateField {
	key: string;
	label: string;
	type: "text" | "date" | "checkbox" | "select";
	required: boolean;
	options?: string[];
}

export interface DocumentTemplate {
	documentType: string;
	category: "consent" | "enrollment";
	title: string;
	description: string;
	requiredFor: ("daycare" | "kindergarten")[];
	fields: TemplateField[];
	legalClauses: string[];
	signatureRequired: boolean;
}

// ────────────────────────────────────────
// 7종 동의서 (consent) — 전략 v4.0
// ────────────────────────────────────────

export const CONSENT_TEMPLATES: DocumentTemplate[] = [
	{
		documentType: "입소동의서",
		category: "consent",
		title: "입소동의서",
		description: "보육·교육 위탁에 대한 보호자 동의서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "childName", label: "아동명", type: "text", required: true },
			{ key: "childBirthDate", label: "생년월일", type: "date", required: true },
			{ key: "guardianName", label: "보호자명", type: "text", required: true },
			{ key: "enrollmentDate", label: "입소일", type: "date", required: true },
			{ key: "className", label: "반명", type: "text", required: true },
		],
		legalClauses: [
			"보육·교육 위탁 동의",
			"시설 이용 규정 준수 동의",
			"비상 시 응급조치 동의",
		],
		signatureRequired: true,
	},
	{
		documentType: "개인정보동의서",
		category: "consent",
		title: "개인정보 수집·이용 동의서",
		description: "개인정보보호법에 따른 수집·이용 동의",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "collectedItems", label: "수집항목", type: "text", required: true },
			{ key: "purpose", label: "이용목적", type: "text", required: true },
			{ key: "retentionPeriod", label: "보유기간", type: "text", required: true },
		],
		legalClauses: [
			"개인정보보호법 제15조에 따른 수집·이용 동의",
			"개인정보 제3자 제공 동의",
			"동의 거부 시 불이익 안내",
		],
		signatureRequired: true,
	},
	{
		documentType: "귀가동의서",
		category: "consent",
		title: "귀가동의서",
		description: "아동 귀가 방법 및 인수자 지정 동의서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "returnMethod", label: "귀가방법", type: "select", required: true, options: ["도보", "차량", "셔틀버스"] },
			{ key: "receiverName", label: "인수자", type: "text", required: true },
			{ key: "emergencyContact", label: "비상연락처", type: "text", required: true },
		],
		legalClauses: [
			"지정 인수자 외 귀가 불가 동의",
			"귀가 중 안전사고 책임 동의",
		],
		signatureRequired: true,
	},
	{
		documentType: "투약의뢰서",
		category: "consent",
		title: "투약의뢰서",
		description: "시설 내 투약 위탁에 대한 보호자 의뢰서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "medicineName", label: "약명", type: "text", required: true },
			{ key: "dosage", label: "투약량", type: "text", required: true },
			{ key: "dosageTime", label: "투약시간", type: "text", required: true },
			{ key: "storageMethod", label: "보관방법", type: "select", required: true, options: ["실온", "냉장"] },
			{ key: "requestPeriod", label: "의뢰기간", type: "text", required: true },
		],
		legalClauses: [
			"투약 위탁 동의",
			"의사 처방에 따른 투약 확인",
		],
		signatureRequired: true,
	},
	{
		documentType: "현장학습동의서",
		category: "consent",
		title: "현장학습동의서",
		description: "원외 현장학습 참여에 대한 보호자 동의서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "location", label: "학습장소", type: "text", required: true },
			{ key: "dateTime", label: "일시", type: "date", required: true },
			{ key: "cost", label: "비용", type: "text", required: false },
			{ key: "supplies", label: "준비물", type: "text", required: false },
		],
		legalClauses: [
			"현장학습 참여 동의",
			"현장학습 중 안전사고 대응 동의",
		],
		signatureRequired: true,
	},
	{
		documentType: "차량운행동의서",
		category: "consent",
		title: "차량운행동의서",
		description: "통학 차량 이용에 대한 보호자 동의서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "route", label: "노선", type: "text", required: true },
			{ key: "stopLocation", label: "승하차지점", type: "text", required: true },
			{ key: "accompanyingTeacher", label: "동승교사", type: "text", required: true },
		],
		legalClauses: [
			"차량 이용 동의",
			"안전벨트 착용 의무 동의",
			"지정 정류장 외 승하차 불가 동의",
		],
		signatureRequired: true,
	},
	{
		documentType: "CCTV열람동의서",
		category: "consent",
		title: "CCTV 열람동의서",
		description: "CCTV 영상 열람에 대한 동의서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "viewReason", label: "열람사유", type: "text", required: true },
			{ key: "viewPeriod", label: "열람기간", type: "text", required: true },
			{ key: "viewerInfo", label: "열람자정보", type: "text", required: true },
		],
		legalClauses: [
			"영유아보육법 제15조의5에 따른 열람 동의",
			"열람 영상 외부 유출 금지 동의",
		],
		signatureRequired: true,
	},
];

// ────────────────────────────────────────
// 7종 서류 (enrollment) — 기존 유지
// ────────────────────────────────────────

export const ENROLLMENT_TEMPLATES: DocumentTemplate[] = [
	{
		documentType: "입소신청서",
		category: "enrollment",
		title: "입소신청서",
		description: "어린이집·유치원 입소 신청서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "childName", label: "아동명", type: "text", required: true },
			{ key: "childBirthDate", label: "생년월일", type: "date", required: true },
			{ key: "guardianName", label: "보호자명", type: "text", required: true },
			{ key: "address", label: "주소", type: "text", required: true },
		],
		legalClauses: ["입소 신청에 따른 정보 제공 동의"],
		signatureRequired: true,
	},
	{
		documentType: "건강검진확인서",
		category: "enrollment",
		title: "건강검진확인서",
		description: "입소 전 건강검진 결과 확인서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "checkupDate", label: "검진일", type: "date", required: true },
			{ key: "result", label: "검진결과", type: "text", required: true },
		],
		legalClauses: ["건강검진 결과 제출 동의"],
		signatureRequired: true,
	},
	{
		documentType: "예방접종증명서",
		category: "enrollment",
		title: "예방접종증명서",
		description: "필수 예방접종 완료 증명서",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "childName", label: "아동명", type: "text", required: true },
			{ key: "vaccinationList", label: "접종내역", type: "text", required: true },
		],
		legalClauses: ["예방접종 정보 제공 동의"],
		signatureRequired: true,
	},
	{
		documentType: "영유아건강검진결과통보서",
		category: "enrollment",
		title: "영유아건강검진결과통보서",
		description: "국가 영유아 건강검진 결과 통보서",
		requiredFor: ["daycare"],
		fields: [
			{ key: "checkupDate", label: "검진일", type: "date", required: true },
			{ key: "checkupStage", label: "검진차수", type: "text", required: true },
			{ key: "result", label: "검진결과", type: "text", required: true },
		],
		legalClauses: ["건강검진 결과 제출 동의"],
		signatureRequired: true,
	},
	{
		documentType: "주민등록등본",
		category: "enrollment",
		title: "주민등록등본",
		description: "가구 구성원 확인을 위한 주민등록등본",
		requiredFor: ["daycare", "kindergarten"],
		fields: [
			{ key: "issueDate", label: "발급일", type: "date", required: true },
		],
		legalClauses: ["주민등록 정보 제공 동의"],
		signatureRequired: false,
	},
	{
		documentType: "재직증명서",
		category: "enrollment",
		title: "재직증명서",
		description: "맞벌이 가구 확인을 위한 재직증명서",
		requiredFor: ["daycare"],
		fields: [
			{ key: "companyName", label: "회사명", type: "text", required: true },
			{ key: "issueDate", label: "발급일", type: "date", required: true },
		],
		legalClauses: ["재직 정보 제공 동의"],
		signatureRequired: false,
	},
	{
		documentType: "소득증빙서류",
		category: "enrollment",
		title: "소득증빙서류",
		description: "보육료 지원 등급 판정을 위한 소득 증빙",
		requiredFor: ["daycare"],
		fields: [
			{ key: "incomeType", label: "소득유형", type: "select", required: true, options: ["근로소득", "사업소득", "기타"] },
			{ key: "issueDate", label: "발급일", type: "date", required: true },
		],
		legalClauses: ["소득 정보 제공 동의"],
		signatureRequired: false,
	},
];

// ────────────────────────────────────────
// 통합 + 헬퍼
// ────────────────────────────────────────

export const ALL_TEMPLATES: DocumentTemplate[] = [
	...CONSENT_TEMPLATES,
	...ENROLLMENT_TEMPLATES,
];

export function getTemplate(documentType: string): DocumentTemplate | undefined {
	return ALL_TEMPLATES.find((t) => t.documentType === documentType);
}

export function getRequiredTemplates(
	facilityCategory: "daycare" | "kindergarten",
): DocumentTemplate[] {
	return ALL_TEMPLATES.filter((t) => t.requiredFor.includes(facilityCategory));
}

export function getConsentTemplates(): DocumentTemplate[] {
	return CONSENT_TEMPLATES;
}

export function getEnrollmentTemplates(): DocumentTemplate[] {
	return ENROLLMENT_TEMPLATES;
}
