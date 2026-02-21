import { Skeleton } from "@/components/dotori/Skeleton";

export default function ChatLoading() {
	return (
		<div className="px-5 pt-4">
			<Skeleton variant="chat" />
		</div>
	);
}
