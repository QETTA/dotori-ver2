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
import { DS_GLASS, DS_LAYOUT, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { fadeIn, tap } from "@/lib/motion";
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

const navShellClass = cn(
	DS_GLASS.FLOAT,
	DS_LAYOUT.CARD_SOFT,
	"fixed bottom-2 left-3 right-3 z-50 mx-auto max-w-md rounded-[1.5rem] bg-gradient-to-b from-white/92 via-dotori-50/88 to-white/88 pb-[env(safe-area-inset-bottom)] ring-1 ring-dotori-200/70 shadow-[0_18px_36px_-28px_rgba(122,78,48,0.7)] dark:from-dotori-950/92 dark:via-dotori-900/88 dark:to-dotori-950/92 dark:ring-dotori-800/80 dark:shadow-none",
);

export const BottomTabBar = memo(function BottomTabBar() {
	const pathname = usePathname();

	function isActive(href: string) {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href);
	}

	return (
		<motion.nav
			className={navShellClass}
			role="navigation"
			aria-label="메인 내비게이션"
			{...fadeIn}
		>
			<div className="flex items-center justify-around px-1.5 py-1.5">
				{tabs.map((tab) => {
					const active = isActive(tab.href);
					const Icon = active ? tab.activeIcon : tab.icon;
					const isChat = tab.id === "chat";

					return (
						<Link
							key={tab.id}
							href={tab.href}
							aria-current={active ? "page" : undefined}
							aria-label={tab.label}
							className={cn(
								"relative flex flex-1 min-h-10 flex-col items-center justify-center gap-0.5 rounded-[0.95rem] py-1.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-300/70 dark:focus-visible:ring-dotori-700/80",
							)}
						>
							<motion.span
								className={cn(
									DS_GLASS.CARD,
									"pointer-events-none absolute inset-0.5 rounded-[0.8rem] bg-gradient-to-b from-dotori-50/75 to-white/65 ring-1 ring-dotori-200/70 dark:from-dotori-900/80 dark:to-dotori-950/75 dark:ring-dotori-700/70",
								)}
								animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
								initial={false}
								transition={{ type: "spring", stiffness: 400, damping: 30 }}
							/>
							<motion.div
								className={cn(
									"relative z-10 grid h-8 w-8 place-items-center rounded-[0.8rem] transition-colors duration-200",
									isChat && "bg-dotori-100/70 dark:bg-dotori-900/65",
									active &&
										"bg-gradient-to-br from-dotori-100 via-dotori-50 to-forest-100 ring-1 ring-dotori-200/80 dark:from-dotori-800 dark:via-dotori-900 dark:to-dotori-900 dark:ring-dotori-700/70",
								)}
								whileTap={tap.button.whileTap}
								transition={{ type: "spring", stiffness: 500, damping: 25 }}
							>
								<Icon
									className={cn(
										"h-5 w-5 transition-colors duration-200",
										active ? "text-dotori-600 dark:text-dotori-200" : "text-dotori-500/80 dark:text-dotori-400/80",
									)}
								/>
							</motion.div>
							<span
								className={cn(
									"relative z-10 tracking-tight transition-colors duration-200",
									DS_TYPOGRAPHY.label,
									active ? "font-semibold text-dotori-600 dark:text-dotori-100" : "font-medium text-dotori-500/80 dark:text-dotori-400/80",
								)}
							>
								{tab.label}
							</span>
						</Link>
					);
				})}
			</div>
		</motion.nav>
	);
})
