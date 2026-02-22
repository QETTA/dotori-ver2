import type { ComponentType, SVGProps } from "react";
import {
	BellIcon,
	CogIcon,
	CreditCardIcon,
	DocumentTextIcon,
	InformationCircleIcon,
	LifebuoyIcon,
	MegaphoneIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";

export type MenuItem = {
	label: string;
	href: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	description: string;
	requiresAuth?: boolean;
};

export type MenuSection = {
	title: string;
	items: MenuItem[];
};

export const menuSections: MenuSection[] = [
	{
		title: "내 정보",
		items: [
			{
				label: "내 정보",
				href: "/my/settings",
				icon: CogIcon,
				description: "닉네임·지역·아이 정보를 관리해요",
				requiresAuth: true,
			},
			{
				label: "플랜 관리",
				href: "/my/settings",
				icon: CreditCardIcon,
				description: "구독 상태를 확인하고 혜택을 바꿔요",
				requiresAuth: true,
			},
		],
	},
	{
		title: "알림",
		items: [
			{
				label: "알림",
				href: "/my/notifications",
				icon: BellIcon,
				description: "입소 알림과 대기 변경사항을 볼 수 있어요",
				requiresAuth: true,
			},
			{
				label: "알림 설정",
				href: "/my/settings",
				icon: SparklesIcon,
				description: "알림 수신 채널과 주기를 조정해요",
				requiresAuth: true,
			},
		],
	},
	{
		title: "앱 정보",
		items: [
			{
				label: "공지사항",
				href: "/my/notices",
				icon: MegaphoneIcon,
				description: "도토리 최신 소식과 점검 일정을 확인해요",
			},
			{
				label: "이용약관",
				href: "/my/terms",
				icon: DocumentTextIcon,
				description: "서비스 이용 규칙을 확인해요",
			},
			{
				label: "고객센터",
				href: "/my/support",
				icon: LifebuoyIcon,
				description: "문의 내역을 작성하고 답변을 받아요",
			},
			{
				label: "앱 정보",
				href: "/my/app-info",
				icon: InformationCircleIcon,
				description: "도토리 앱 정보를 확인해요",
			},
		],
	},
];

export const publicMenuSections: MenuSection[] = menuSections
	.map((section) => ({
		...section,
		items: section.items.filter((item) => item.requiresAuth !== true),
	}))
	.filter((section) => section.items.length > 0);
