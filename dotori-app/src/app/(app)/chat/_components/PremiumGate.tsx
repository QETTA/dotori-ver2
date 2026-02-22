import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
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
				<Badge color="dotori" className="text-xs">
					{usageLimit}회 제한
				</Badge>
				{` ${message}`}
			</Text>
			<Button href="/landing" color="dotori" className="mt-2.5 w-full">
				프리미엄으로 업그레이드
			</Button>
		</div>
	);
}
