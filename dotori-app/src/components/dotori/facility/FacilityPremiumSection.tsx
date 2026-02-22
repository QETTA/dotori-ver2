import { Badge } from "@/components/catalyst/badge";

interface FacilityPremiumSectionProps {
	showPremiumSection: boolean;
	premiumVerifiedAt: string | null;
	premiumDirectorMessage?: string;
	premiumPrograms?: string[];
	premiumHighlights?: string[];
	premiumPhotos?: string[];
	facilityName: string;
}

export function FacilityPremiumSection({
	showPremiumSection,
	premiumVerifiedAt,
	premiumDirectorMessage,
	premiumPrograms,
	premiumHighlights,
	premiumPhotos,
	facilityName,
}: FacilityPremiumSectionProps) {
	if (!showPremiumSection) return null;

	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-sm font-semibold text-dotori-900">인증 시설 정보</h2>
				{premiumVerifiedAt ? (
					<p className="text-sm font-medium text-forest-700">
						인증일: {premiumVerifiedAt}
					</p>
				) : null}
			</div>
			{premiumDirectorMessage ? (
				<div className="mt-3 rounded-2xl bg-dotori-50 p-4">
					<h3 className="mb-1 text-sm font-medium text-dotori-700">원장 한마디</h3>
					<p className="text-sm leading-6 text-dotori-800">{premiumDirectorMessage}</p>
				</div>
			) : null}

			{premiumPrograms && premiumPrograms.length > 0 ? (
				<div className="mt-3">
					<h3 className="mb-2 text-sm font-medium text-dotori-700">프로그램</h3>
					<div className="mt-2 flex flex-wrap gap-2">
						{premiumPrograms.map((program) => (
							<Badge key={program} color="forest">
								{program}
							</Badge>
						))}
					</div>
				</div>
			) : null}

			{premiumHighlights && premiumHighlights.length > 0 ? (
				<div className="mt-3">
					<h3 className="mb-2 text-sm font-medium text-dotori-700">하이라이트</h3>
					<ul className="space-y-1.5">
						{premiumHighlights.map((highlight) => (
							<li key={highlight} className="text-sm text-dotori-700">
								<span className="mr-2 inline-block text-forest-500">✓</span>
								{highlight}
							</li>
						))}
					</ul>
				</div>
			) : null}

			{premiumPhotos && premiumPhotos.length > 0 ? (
				<div className="mt-3">
					<h3 className="mb-2 text-sm font-medium text-dotori-700">추가 사진</h3>
					<div className="grid grid-cols-2 gap-2">
						{premiumPhotos.map((photo, index) => (
							<div key={`${photo}-${index}`} className="overflow-hidden rounded-xl">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={photo}
									alt={`${facilityName} 인증 시설 사진 ${index + 1}`}
									loading="lazy"
									className="h-28 w-full rounded-xl object-cover"
								/>
							</div>
						))}
					</div>
				</div>
			) : null}
		</section>
	);
}
