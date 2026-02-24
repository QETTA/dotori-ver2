import { Badge } from "@/components/catalyst/badge";
import { DsButton } from "@/components/ds/DsButton";
import { Text } from "@/components/catalyst/text";

export function PremiumGate({
	usageLimit,
	message,
}: {
	usageLimit: number;
	message: string;
}) {
	return (
		<div className="mb-2 rounded-2xl border border-dotori-200 bg-dotori-50 px-4 py-3">
			<Text className="text-sm font-semibold text-dotori-800">
				이번 달 무료 채팅 횟수를 모두 사용했어요
			</Text>
			<Text className="mt-1 text-sm text-dotori-700">
				<Badge className="text-xs">
					{usageLimit}회 제한
				</Badge>
				{` ${message}`}
			</Text>
			<DsButton href="/landing" className="mt-2.5 w-full">
				프리미엄으로 업그레이드
			</DsButton>
		</div>
	);
}
