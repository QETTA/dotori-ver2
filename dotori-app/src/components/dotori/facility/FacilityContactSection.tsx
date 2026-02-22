import {
	ClipboardDocumentIcon,
	GlobeAltIcon,
	MapPinIcon,
	PhoneIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/catalyst/button";

type FacilityContactSectionProps = {
	phone?: string;
	address: string;
	kakaoMapUrl: string;
	websiteUrl: string | null;
	copyableAddress?: string;
	copyingAddress: boolean;
	onCopyAddress: () => void;
};

export function FacilityContactSection({
	phone,
	address,
	kakaoMapUrl,
	websiteUrl,
	copyableAddress,
	copyingAddress,
	onCopyAddress,
}: FacilityContactSectionProps) {
	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm">
			<h2 className="text-sm font-semibold text-dotori-900">연락처</h2>
			<div className="mt-3 space-y-2 text-[14px] text-dotori-700">
				{phone ? (
					<a
						href={`tel:${phone}`}
						className="flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-colors hover:bg-dotori-50"
					>
						<PhoneIcon className="h-5 w-5 text-dotori-500" />
						<span>{phone}</span>
					</a>
				) : (
					<div className="flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 text-dotori-500">
						<PhoneIcon className="h-5 w-5" />
						<span>전화번호 미제공</span>
					</div>
				)}
				<div className="flex flex-col gap-2 sm:flex-row">
					<a
						href={kakaoMapUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="min-h-12 flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-colors hover:bg-dotori-50"
					>
						<MapPinIcon className="h-5 w-5 text-dotori-500" />
						<span className="line-clamp-2">{address}</span>
					</a>
					<Button
						plain={true}
						type="button"
						onClick={onCopyAddress}
						disabled={!copyableAddress || copyingAddress}
						className="min-h-12 min-w-28 px-3"
					>
						<ClipboardDocumentIcon className="h-5 w-5" />
						주소 복사
					</Button>
				</div>
				{websiteUrl && (
					<a
						href={websiteUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-colors hover:bg-dotori-50"
					>
						<GlobeAltIcon className="h-5 w-5 text-dotori-500" />
						<span>홈페이지 열기</span>
					</a>
				)}
			</div>
		</section>
	);
}
