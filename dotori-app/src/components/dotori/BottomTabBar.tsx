"use client";

import {
	ChatBubbleLeftIcon as ChatOutline,
	UserGroupIcon as GroupOutline,
	HomeIcon as HomeOutline,
	MagnifyingGlassIcon as SearchOutline,
	UserCircleIcon as UserOutline,
} from "@heroicons/react/24/outline";
import {
	ChatBubbleLeftIcon as ChatSolid,
	UserGroupIcon as GroupSolid,
	HomeIcon as HomeSolid,
	MagnifyingGlassIcon as SearchSolid,
	UserCircleIcon as UserSolid,
} from "@heroicons/react/24/solid";
import { memo } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
	{
		id: "home",
		label: "홈",
		href: "/",
		icon: HomeOutline,
		activeIcon: HomeSolid,
	},
	{
		id: "explore",
		label: "탐색",
		href: "/explore",
		icon: SearchOutline,
		activeIcon: SearchSolid,
	},
	{
		id: "chat",
		label: "토리챗",
		href: "/chat",
		icon: ChatOutline,
		activeIcon: ChatSolid,
	},
	{
		id: "community",
		label: "이웃",
		href: "/community",
		icon: GroupOutline,
		activeIcon: GroupSolid,
	},
	{
		id: "my",
		label: "MY",
		href: "/my",
		icon: UserOutline,
		activeIcon: UserSolid,
	},
] as const;

export const BottomTabBar = memo(function BottomTabBar() {
	const pathname = usePathname();

	function isActive(href: string) {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href);
	}

	return (
		<nav
			className="fixed bottom-3 left-4 right-4 z-50 mx-auto max-w-md rounded-3xl bg-white/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_24px_rgba(200,149,106,0.12)] ring-1 ring-white/60 backdrop-blur-2xl"
			role="navigation"
			aria-label="메인 내비게이션"
		>
			<div className="flex items-center justify-around px-1.5 py-1.5">
				{tabs.map((tab) => {
					const active = isActive(tab.href);
					const Icon = active ? tab.activeIcon : tab.icon;

					return (
						<Link
							key={tab.id}
							href={tab.href}
							role="tab"
							aria-selected={active}
							aria-current={active ? "page" : undefined}
							aria-label={tab.label}
							className="relative flex flex-1 min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 transition-colors duration-150 active:scale-[0.97]"
						>
							<motion.span
								className="pointer-events-none absolute inset-1 rounded-2xl bg-dotori-100/80"
								animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
								initial={false}
								transition={{ type: "spring", stiffness: 400, damping: 30 }}
							/>
							<motion.div
								className="relative z-10"
								whileTap={{ scale: 0.85 }}
								transition={{ type: "spring", stiffness: 500, damping: 25 }}
							>
								<Icon
									className={cn(
										"h-6 w-6 transition-colors duration-200",
										active
											? "text-dotori-900"
											: "text-dotori-500",
									)}
								/>
							</motion.div>
							<span
								className={cn(
									"relative z-10 text-[12px] tracking-tight transition-colors duration-200",
									active
										? "font-semibold text-dotori-900"
										: "text-dotori-500",
								)}
							>
								{tab.label}
							</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
})
